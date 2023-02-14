/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  CoreStart,
  ILegacyClusterClient,
  Logger,
  Plugin,
  PluginInitializerContext,
  SavedObjectsType,
} from '../../../src/core/server';
import { OpenSearchObservabilityPlugin } from './adaptors/opensearch_observability_plugin';
import { PPLPlugin } from './adaptors/ppl_plugin';
import { setupRoutes } from './routes/index';
import { ObservabilityPluginSetup, ObservabilityPluginStart } from './types';
import { migrations } from '../../../src/core/server/ui_settings/saved_objects/migrations';

export class ObservabilityPlugin
  implements Plugin<ObservabilityPluginSetup, ObservabilityPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('Observability: Setup');
    const router = core.http.createRouter();
    const openSearchObservabilityClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_observability',
      {
        plugins: [PPLPlugin, OpenSearchObservabilityPlugin],
      }
    );

    // @ts-ignore
    core.http.registerRouteHandlerContext('observability_plugin', (context, request) => {
      return {
        logger: this.logger,
        observabilityClient: openSearchObservabilityClient,
      };
    });

    const obsPanelType: SavedObjectsType = {
      name: 'observability-panel',
      hidden: false,
      namespaceType: 'single',
      mappings: {
        properties: {
          title: {
            type: 'text',
          },
          description: {
            type: 'text',
          },
        },
      },
      management: {
        importableAndExportable: true,
        getInAppUrl() {
          return {
            path: `/app/management/observability/settings`,
            uiCapabilitiesPath: 'advancedSettings.show',
          };
        },
        getTitle(obj) {
          return `Observability Settings [${obj.id}]`;
        },
      },
      migrations: {
        '3.0.0': (doc) => ({ ...doc, description: '' }),
        '3.0.1': (doc) => ({ ...doc, description: 'Some Description Text' }),
      },
    };

    core.savedObjects.registerType(obsPanelType);

    // Register server side APIs
    setupRoutes({ router, client: openSearchObservabilityClient });

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('Observability: Started');
    return {};
  }

  public stop() {}
}
