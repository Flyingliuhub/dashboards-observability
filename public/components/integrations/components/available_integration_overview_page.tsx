/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable react-hooks/exhaustive-deps */

import {
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFilterSelectItem,
  EuiOverlayMask,
  EuiPage,
  EuiPageBody,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import _ from 'lodash';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { StringRegexOptions } from 'joi';
import { IntegrationHeader } from './integration_header';
import { AvailableIntegrationsTable } from './available_integration_table';
import { AvailableIntegrationsCardView } from './available_integration_card_view';
import { INTEGRATIONS_BASE } from '../../../../common/constants/shared';
import { getAddIntegrationModal } from './add_integration_modal';
import { AvailableIntegrationOverviewPageProps } from './integration_types';
import { useToast } from '../../../../public/components/common/toast';

export interface AvailableIntegrationType {
  name: string;
  description: string;
  assetUrl?: string | undefined;
  version?: string | undefined;
  displayName?: string;
  integrationType: string;
  statics: any;
  components: any[];
  displayAssets: any[];
}

export interface AvailableIntegrationsTableProps {
  loading: boolean;
  data: AvailableIntegrationsList;
  showModal: (input: string) => void;
  isCardView: boolean;
  setCardView: (input: boolean) => void;
  renderCateogryFilters: () => React.JSX.Element;
}

export interface AvailableIntegrationsList {
  hits: AvailableIntegrationType[];
}

export interface AvailableIntegrationsCardViewProps {
  data: AvailableIntegrationsList;
  showModal: (input: string) => void;
  isCardView: boolean;
  setCardView: (input: boolean) => void;
  query: string;
  setQuery: (input: string) => void;
  renderCateogryFilters: () => React.JSX.Element;
}

export function AvailableIntegrationOverviewPage(props: AvailableIntegrationOverviewPageProps) {
  const { chrome, http } = props;

  const [query, setQuery] = useState('');
  const [isCardView, setCardView] = useState(true);
  const { setToast } = useToast();
  const [data, setData] = useState<AvailableIntegrationsList>({ hits: [] });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLayout, setModalLayout] = useState(<EuiOverlayMask />);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const [items, setItems] = useState([
    { name: 'http' },
    { name: 'logs' },
    { name: 'communication' },
    { name: 'cloud' },
    { name: 'aws_elb' },
    { name: 'container' },
  ]);

  function updateItem(index) {
    if (!items[index]) {
      return;
    }

    const newItems = [...items];

    switch (newItems[index].checked) {
      case 'on':
        newItems[index].checked = undefined;
        break;

      default:
        newItems[index].checked = 'on';
    }

    setItems(newItems);
  }

  const helper = items.filter((item) => item.checked === 'on').map((x) => x.name);

  const button = (
    <EuiFilterButton
      iconType="arrowDown"
      onClick={onButtonClick}
      isSelected={isPopoverOpen}
      numFilters={items.length}
      hasActiveFilters={!!items.find((item) => item.checked === 'on')}
      numActiveFilters={items.filter((item) => item.checked === 'on').length}
    >
      Categories
    </EuiFilterButton>
  );

  const getModal = (name: string) => {
    setModalLayout(
      getAddIntegrationModal(
        () => {
          addIntegrationRequest(name);
          setIsModalVisible(false);
        },
        () => {
          setIsModalVisible(false);
        },
        'Name',
        'Namespace',
        'Tags (optional)',
        name,
        'prod',
        'Add Integration Options',
        'Cancel',
        'Add',
        'test'
      )
    );
    setIsModalVisible(true);
  };

  useEffect(() => {
    chrome.setBreadcrumbs([
      {
        text: 'Integrations',
        href: '#/',
      },
    ]);
    handleDataRequest();
  }, []);

  async function handleDataRequest() {
    http.get(`${INTEGRATIONS_BASE}/repository`).then((exists) => setData(exists.data));
  }

  async function addIntegrationRequest(name: string) {
    http
      .post(`${INTEGRATIONS_BASE}/store`)
      .then((res) => {
        setToast(
          `${name} integration successfully added!`,
          'success',
          `View the added assets from ${name} in the Added Integrations list`
        );
      })
      .catch((err) =>
        setToast(
          'Failed to load integration. Check Added Integrations table for more details',
          'danger'
        )
      );
  }

  const renderCateogryFilters = () => {
    return (
      <EuiFilterGroup>
        <EuiPopover
          id="popoverExampleMultiSelect"
          button={button}
          isOpen={isPopoverOpen}
          closePopover={closePopover}
          panelPaddingSize="none"
        >
          <EuiPopoverTitle paddingSize="s">
            <EuiFieldSearch compressed />
          </EuiPopoverTitle>
          <div className="ouiFilterSelect__items">
            {items.map((item, index) => (
              <EuiFilterSelectItem
                checked={item.checked}
                key={index}
                onClick={() => updateItem(index)}
              >
                {item.name}
              </EuiFilterSelectItem>
            ))}
          </div>
        </EuiPopover>
      </EuiFilterGroup>
    );
  };

  return (
    <EuiPage>
      <EuiPageBody>
        {IntegrationHeader()}
        {isCardView
          ? AvailableIntegrationsCardView({
              data: {
                hits: data.hits.filter((hit) =>
                  helper.every((compon) => hit.components.map((x) => x.name).includes(compon))
                ),
              },
              showModal: getModal,
              isCardView,
              setCardView,
              query,
              setQuery,
              renderCateogryFilters,
            })
          : AvailableIntegrationsTable({
              loading: false,
              data: {
                hits: data.hits.filter((hit) =>
                  helper.every((compon) => hit.components.map((x) => x.name).includes(compon))
                ),
              },
              showModal: getModal,
              isCardView,
              setCardView,
              renderCateogryFilters,
            })}
      </EuiPageBody>
      {isModalVisible && modalLayout}
    </EuiPage>
  );
}
