import type {CSSProperties, ReactNode} from 'react';
import {isValidElement, useCallback, useEffect, useRef} from 'react';
import {useTheme} from '@emotion/react';
import styled from '@emotion/styled';
import beautify from 'js-beautify';

import {CodeSnippet} from 'sentry/components/codeSnippet';
import {ProjectAvatar} from 'sentry/components/core/avatar/projectAvatar';
import {Button} from 'sentry/components/core/button';
import {Tooltip} from 'sentry/components/core/tooltip';
import ErrorBoundary from 'sentry/components/errorBoundary';
import Link from 'sentry/components/links/link';
import Placeholder from 'sentry/components/placeholder';
import {OpenReplayComparisonButton} from 'sentry/components/replays/breadcrumbs/openReplayComparisonButton';
import {useReplayContext} from 'sentry/components/replays/replayContext';
import {useReplayGroupContext} from 'sentry/components/replays/replayGroupContext';
import StructuredEventData from 'sentry/components/structuredEventData';
import {Timeline} from 'sentry/components/timeline';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {trackAnalytics} from 'sentry/utils/analytics';
import type {Extraction} from 'sentry/utils/replays/extractDomNodes';
import {getReplayDiffOffsetsFromFrame} from 'sentry/utils/replays/getDiffTimestamps';
import getFrameDetails from 'sentry/utils/replays/getFrameDetails';
import useExtractDomNodes from 'sentry/utils/replays/hooks/useExtractDomNodes';
import type ReplayReader from 'sentry/utils/replays/replayReader';
import type {
  ErrorFrame,
  FeedbackFrame,
  HydrationErrorFrame,
  ReplayFrame,
  WebVitalFrame,
} from 'sentry/utils/replays/types';
import {
  isBreadcrumbFrame,
  isCLSFrame,
  isErrorFrame,
  isFeedbackFrame,
  isHydrationErrorFrame,
  isSpanFrame,
  isWebVitalFrame,
} from 'sentry/utils/replays/types';
import useOrganization from 'sentry/utils/useOrganization';
import useProjectFromSlug from 'sentry/utils/useProjectFromSlug';
import TimestampButton from 'sentry/views/replays/detail/timestampButton';
import type {OnExpandCallback} from 'sentry/views/replays/detail/useVirtualizedInspector';
import {makeFeedbackPathname} from 'sentry/views/userFeedback/pathnames';

type MouseCallback = (frame: ReplayFrame, nodeId?: number) => void;

interface Props {
  allowShowSnippet: boolean;
  frame: ReplayFrame;
  onClick: null | MouseCallback;
  onInspectorExpanded: OnExpandCallback;
  onMouseEnter: MouseCallback;
  onMouseLeave: MouseCallback;
  onShowSnippet: () => void;
  showSnippet: boolean;
  startTimestampMs: number;
  className?: string;
  expandPaths?: string[];
  extraction?: Extraction;
  ref?: React.Ref<HTMLDivElement>;
  style?: CSSProperties;
  updateDimensions?: () => void;
}

function BreadcrumbItem({
  className,
  frame,
  expandPaths,
  onClick,
  onInspectorExpanded,
  onMouseEnter,
  onMouseLeave,
  showSnippet,
  startTimestampMs,
  style,
  ref,
  onShowSnippet,
  updateDimensions,
  allowShowSnippet,
}: Props) {
  const theme = useTheme();
  const {colorGraphicsToken, description, title, icon} = getFrameDetails(frame);
  const colorHex = theme.tokens.graphics[colorGraphicsToken];
  const {replay} = useReplayContext();
  const organization = useOrganization();
  const {data: extraction, isPending} = useExtractDomNodes({
    replay,
    frame,
    enabled: showSnippet,
  });

  const prevExtractState = useRef(isPending);

  useEffect(() => {
    if (!updateDimensions) {
      return;
    }

    if (isPending !== prevExtractState.current || showSnippet) {
      prevExtractState.current = isPending;
      updateDimensions();
    }
  }, [isPending, updateDimensions, showSnippet]);

  const handleViewHtml = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onShowSnippet();
      e.preventDefault();
      e.stopPropagation();
      trackAnalytics('replay.view-html', {
        organization,
        breadcrumb_type: 'category' in frame ? frame.category : 'unknown',
      });
    },
    [onShowSnippet, organization, frame]
  );

  const renderDescription = useCallback(() => {
    return typeof description === 'string' ||
      (description !== undefined && isValidElement(description)) ? (
      <DescriptionWrapper>
        <Description title={description} showOnlyOnOverflow isHoverable>
          {description}
        </Description>

        {allowShowSnippet &&
          !showSnippet &&
          frame.data?.nodeId !== undefined &&
          (!isSpanFrame(frame) || !isWebVitalFrame(frame)) && (
            <ViewHtmlButton priority="link" onClick={handleViewHtml} size="xs">
              {t('View HTML')}
            </ViewHtmlButton>
          )}
      </DescriptionWrapper>
    ) : (
      <Wrapper>
        <StructuredEventData
          initialExpandedPaths={expandPaths ?? []}
          onToggleExpand={(expandedPaths, path) => {
            onInspectorExpanded(
              path,
              Object.fromEntries(expandedPaths.map(item => [item, true]))
            );
          }}
          data={description}
          withAnnotatedText
        />
      </Wrapper>
    );
  }, [
    description,
    expandPaths,
    frame,
    onInspectorExpanded,
    showSnippet,
    allowShowSnippet,
    handleViewHtml,
  ]);

  const renderComparisonButton = useCallback(() => {
    return isBreadcrumbFrame(frame) && isHydrationErrorFrame(frame) && replay ? (
      <CrumbHydrationButton replay={replay} frame={frame} />
    ) : null;
  }, [frame, replay]);

  const renderWebVital = useCallback(() => {
    return isSpanFrame(frame) && isWebVitalFrame(frame) ? (
      <WebVitalData
        selectors={extraction?.selectors}
        frame={frame}
        expandPaths={expandPaths}
        onInspectorExpanded={onInspectorExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    ) : null;
  }, [
    expandPaths,
    extraction?.selectors,
    frame,
    onInspectorExpanded,
    onMouseEnter,
    onMouseLeave,
  ]);

  const renderCodeSnippet = useCallback(() => {
    if (showSnippet && isPending) {
      return <Placeholder height="34px" />;
    }

    return (
      (!isSpanFrame(frame) || !isWebVitalFrame(frame)) &&
      !isPending &&
      showSnippet &&
      extraction?.html?.map(html => (
        <CodeContainer key={html}>
          <CodeSnippet language="html" hideCopyButton>
            {beautify.html(html, {indent_size: 2})}
          </CodeSnippet>
        </CodeContainer>
      ))
    );
  }, [frame, isPending, extraction?.html, showSnippet]);

  const renderIssueLink = useCallback(() => {
    return isErrorFrame(frame) || isFeedbackFrame(frame) ? (
      <CrumbErrorIssue frame={frame} />
    ) : null;
  }, [frame]);

  return (
    <StyledTimelineItem
      ref={ref}
      icon={icon}
      title={title}
      colorConfig={{title: colorHex, icon: colorHex, iconBorder: colorHex}}
      timestamp={
        <ReplayTimestamp>
          <TimestampButton
            startTimestampMs={startTimestampMs}
            timestampMs={frame.timestampMs}
          />
        </ReplayTimestamp>
      }
      data-is-error-frame={isErrorFrame(frame)}
      style={style}
      className={className}
      onClick={event => {
        event.stopPropagation();
        onClick?.(frame);
      }}
      onMouseEnter={() => onMouseEnter(frame)}
      onMouseLeave={() => onMouseLeave(frame)}
    >
      <ErrorBoundary mini>
        {renderDescription()}
        {renderComparisonButton()}
        {renderWebVital()}
        {renderCodeSnippet()}
        {renderIssueLink()}
      </ErrorBoundary>
    </StyledTimelineItem>
  );
}

function WebVitalData({
  selectors,
  frame,
  expandPaths,
  onInspectorExpanded,
  onMouseEnter,
  onMouseLeave,
}: {
  expandPaths: string[] | undefined;
  frame: WebVitalFrame;
  onInspectorExpanded: OnExpandCallback;
  onMouseEnter: MouseCallback;
  onMouseLeave: MouseCallback;
  selectors: Map<number, string> | undefined;
}) {
  const webVitalData = {value: frame.data.value};
  if (isCLSFrame(frame) && frame.data.attributions && selectors) {
    const layoutShifts: Array<Record<string, ReactNode[]>> = [];
    for (const attr of frame.data.attributions) {
      const elements: ReactNode[] = [];
      if ('nodeIds' in attr && Array.isArray(attr.nodeIds)) {
        attr.nodeIds.forEach(nodeId => {
          if (selectors.get(nodeId)) {
            elements.push(
              <span
                key={nodeId}
                onMouseEnter={() => onMouseEnter(frame, nodeId)}
                onMouseLeave={() => onMouseLeave(frame, nodeId)}
              >
                <ValueObjectKey>{t('element')}</ValueObjectKey>
                <span>{': '}</span>
                <span>
                  <SelectorButton>{selectors.get(nodeId)}</SelectorButton>
                </span>
              </span>
            );
          }
        });
      }
      // if we can't find the elements associated with the layout shift, we still show the score with element: unknown
      if (!elements.length) {
        elements.push(
          <span>
            <ValueObjectKey>{t('element')}</ValueObjectKey>
            <span>{': '}</span>
            <ValueNull>{t('unknown')}</ValueNull>
          </span>
        );
      }
      layoutShifts.push({[`score ${attr.value}`]: elements});
    }
    if (layoutShifts.length) {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      webVitalData['Layout shifts'] = layoutShifts;
    }
  } else if (selectors) {
    selectors.forEach((key, value) => {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      webVitalData[key] = (
        <span
          key={key}
          onMouseEnter={() => onMouseEnter(frame, value)}
          onMouseLeave={() => onMouseLeave(frame, value)}
        >
          <ValueObjectKey>{t('element')}</ValueObjectKey>
          <span>{': '}</span>
          <SelectorButton size="zero" borderless>
            {key}
          </SelectorButton>
        </span>
      );
    });
  }

  return (
    <Wrapper>
      <StructuredEventData
        initialExpandedPaths={expandPaths ?? []}
        onToggleExpand={(expandedPaths, path) => {
          onInspectorExpanded(
            path,
            Object.fromEntries(expandedPaths.map(item => [item, true]))
          );
        }}
        data={webVitalData}
        withAnnotatedText
      />
    </Wrapper>
  );
}

function CrumbHydrationButton({
  replay,
  frame,
}: {
  frame: HydrationErrorFrame;
  replay: ReplayReader;
}) {
  const {frameOrEvent, leftOffsetMs, rightOffsetMs} = getReplayDiffOffsetsFromFrame(
    replay,
    frame
  );

  return (
    <div>
      <OpenReplayComparisonButton
        frameOrEvent={frameOrEvent}
        initialLeftOffsetMs={leftOffsetMs}
        initialRightOffsetMs={rightOffsetMs}
        replay={replay}
        size="xs"
        surface="replay-breadcrumbs"
      >
        {t('Open Hydration Diff')}
      </OpenReplayComparisonButton>
    </div>
  );
}

function CrumbErrorIssue({frame}: {frame: FeedbackFrame | ErrorFrame}) {
  const organization = useOrganization();
  const project = useProjectFromSlug({organization, projectSlug: frame.data.projectSlug});
  const {groupId} = useReplayGroupContext();

  const projectAvatar = project ? <ProjectAvatar project={project} size={16} /> : null;

  if (String(frame.data.groupId) === groupId) {
    return (
      <CrumbIssueWrapper>
        {projectAvatar}
        {frame.data.groupShortId}
      </CrumbIssueWrapper>
    );
  }

  return (
    <CrumbIssueWrapper>
      {projectAvatar}
      <Link
        to={
          isFeedbackFrame(frame)
            ? {
                pathname: makeFeedbackPathname({
                  path: '/',
                  organization,
                }),
                query: {feedbackSlug: `${frame.data.projectSlug}:${frame.data.groupId}`},
              }
            : `/organizations/${organization.slug}/issues/${frame.data.groupId}/`
        }
      >
        {frame.data.groupShortId}
      </Link>
    </CrumbIssueWrapper>
  );
}

const CrumbIssueWrapper = styled('div')`
  display: flex;
  align-items: center;
  gap: ${space(0.5)};
  font-size: ${p => p.theme.fontSize.sm};
  color: ${p => p.theme.subText};
`;

const Description = styled(Tooltip)`
  ${p => p.theme.overflowEllipsis};
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  line-height: ${p => p.theme.text.lineHeightBody};
  color: ${p => p.theme.subText};
`;

const DescriptionWrapper = styled('div')`
  display: flex;
  gap: ${space(1)};
  justify-content: space-between;
`;

const ViewHtmlButton = styled(Button)`
  white-space: nowrap;
`;

const StyledTimelineItem = styled(Timeline.Item)`
  width: 100%;
  position: relative;
  padding: ${space(0.5)} ${space(0.75)};
  margin: 0;
  &:hover {
    background: ${p => p.theme.translucentSurface200};
    .timeline-icon-wrapper {
      background: ${p => p.theme.translucentSurface200};
    }
  }
  cursor: pointer;
  /* vertical line connecting items */
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 16.5px;
    width: 1px;
    top: -2px;
    bottom: -9px;
    background: ${p => p.theme.border};
    z-index: 0;
  }
  &:first-child::before {
    top: 4px;
  }
`;

const ReplayTimestamp = styled('div')`
  color: ${p => p.theme.textColor};
  font-size: ${p => p.theme.fontSize.sm};
  align-self: flex-start;
`;

const CodeContainer = styled('div')`
  max-height: 400px;
  max-width: 100%;
  overflow: auto;
`;

const ValueObjectKey = styled('span')`
  color: var(--prism-keyword);
`;

const ValueNull = styled('span')`
  font-weight: ${p => p.theme.fontWeight.bold};
  color: var(--prism-property);
`;

const SelectorButton = styled(Button)`
  background: none;
  border: none;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: ${p => p.theme.fontWeight.normal};
  box-shadow: none;
  font-size: ${p => p.theme.fontSize.sm};
  color: ${p => p.theme.subText};
  margin: 0 ${space(0.5)};
  height: auto;
  min-height: auto;
`;

const Wrapper = styled('div')`
  pre {
    margin: 0;
  }
`;

export default BreadcrumbItem;
