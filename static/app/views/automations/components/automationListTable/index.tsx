import styled from '@emotion/styled';

import LoadingError from 'sentry/components/loadingError';
import {SimpleTable} from 'sentry/components/tables/simpleTable';
import {t} from 'sentry/locale';
import type {Automation} from 'sentry/types/workflowEngine/automations';
import type {Sort} from 'sentry/utils/discover/fields';
import {useLocation} from 'sentry/utils/useLocation';
import {useNavigate} from 'sentry/utils/useNavigate';
import {
  AutomationListRow,
  AutomationListRowSkeleton,
} from 'sentry/views/automations/components/automationListTable/row';
import {AUTOMATION_LIST_PAGE_LIMIT} from 'sentry/views/automations/constants';

type AutomationListTableProps = {
  automations: Automation[];
  isError: boolean;
  isPending: boolean;
  isSuccess: boolean;
  sort: Sort | undefined;
};

function LoadingSkeletons() {
  return Array.from({length: AUTOMATION_LIST_PAGE_LIMIT}).map((_, index) => (
    <AutomationListRowSkeleton key={index} />
  ));
}

function HeaderCell({
  children,
  className,
  sortKey,
  sort,
}: {
  children: React.ReactNode;
  className: string;
  sort: Sort | undefined;
  divider?: boolean;
  sortKey?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isSortedByField = sort?.field === sortKey;
  const handleSort = () => {
    if (!sortKey) {
      return;
    }
    const newSort =
      sort && isSortedByField ? `${sort.kind === 'asc' ? '-' : ''}${sortKey}` : sortKey;
    navigate({
      pathname: location.pathname,
      query: {...location.query, sort: newSort, cursor: undefined},
    });
  };

  return (
    <SimpleTable.HeaderCell
      className={className}
      sort={sort}
      sortKey={sortKey}
      handleSortClick={handleSort}
    >
      {children}
    </SimpleTable.HeaderCell>
  );
}

function AutomationListTable({
  automations,
  isPending,
  isError,
  isSuccess,
  sort,
}: AutomationListTableProps) {
  return (
    <AutomationsSimpleTable>
      <SimpleTable.Header>
        <HeaderCell className="name" sort={sort} sortKey="name">
          {t('Name')}
        </HeaderCell>
        <HeaderCell className="last-triggered" sort={sort}>
          {t('Last Triggered')}
        </HeaderCell>
        <HeaderCell className="action" sort={sort} sortKey="actions">
          {t('Actions')}
        </HeaderCell>
        <HeaderCell className="projects" sort={sort}>
          {t('Projects')}
        </HeaderCell>
        <HeaderCell
          className="connected-monitors"
          sort={sort}
          sortKey="connectedDetectors"
        >
          {t('Monitors')}
        </HeaderCell>
      </SimpleTable.Header>
      {isSuccess && automations.length === 0 && (
        <SimpleTable.Empty>{t('No automations found')}</SimpleTable.Empty>
      )}
      {isError && <LoadingError message={t('Error loading automations')} />}
      {isPending && <LoadingSkeletons />}
      {isSuccess &&
        automations.map(automation => (
          <AutomationListRow key={automation.id} automation={automation} />
        ))}
    </AutomationsSimpleTable>
  );
}

const AutomationsSimpleTable = styled(SimpleTable)`
  grid-template-columns: 1fr;

  .last-triggered,
  .action,
  .projects,
  .connected-monitors {
    display: none;
  }

  @media (min-width: ${p => p.theme.breakpoints.xs}) {
    grid-template-columns: 2.5fr 1fr;

    .projects {
      display: flex;
    }
  }

  @media (min-width: ${p => p.theme.breakpoints.sm}) {
    grid-template-columns: 2.5fr 1fr 1fr;

    .action {
      display: flex;
    }
  }

  @media (min-width: ${p => p.theme.breakpoints.md}) {
    grid-template-columns: 2.5fr 1fr 1fr 1fr;

    .last-triggered {
      display: flex;
    }
  }

  @media (min-width: ${p => p.theme.breakpoints.lg}) {
    grid-template-columns: minmax(0, 3fr) 1fr 1fr 1fr 1fr;

    .connected-monitors {
      display: flex;
    }
  }
`;

export default AutomationListTable;
