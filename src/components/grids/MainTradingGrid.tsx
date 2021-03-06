import React, { ReactNode } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import {
  MainGridLayout,
  MainGridBreakPoints,
  COLS,
  GRID_ROW_HEIGHT,
} from "./MainTradingGrid.layout-config";
import { AppTradeType } from "@/constants/trade-type";
import {
  WorkspaceSetting,
  WorkspaceSettingEnum,
} from "@/models/workspace-setting";
import { getSetting } from "@/selectors/ui-setting.selectors";
import { connect } from "react-redux";
import { shallowCompareArrays, shallowCompareObjects } from "@/exports";
import {
  getCardToolByKey,
  getCardContentPaddingByKey,
  getCardInnerByKey,
  getCardNameByKey,
  omitWorkspace,
} from "./MainTradingGrid.helpers";
import {
  setFullScreenMode,
  toggleWorkspaceSetting,
} from "@/actions/ui-setting.actions";
import { Card } from "@/ui-components";
import { isUserLoggedIn } from "@/selectors/auth.selectors";
import { OrderForm } from "../order-form";
import { getWalletIdFromName } from "@/constants/balance-enums";
import { OrderEntry } from "@/models/order.model";
import { getOrderEntries } from "@/selectors/order.selectors";

import { IconButton } from "@/ui-components";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface MainTradingGridProps {
  enabledWorkspaces: WorkspaceSetting;
  symbol: string;
  tradeType: AppTradeType;
  closeElement: (key: WorkspaceSettingEnum) => void;
  margin?: number[];
  breakpoints: object;
  layouts: object;
  orderEntries: OrderEntry[];
  setFullScreenMode: (status: boolean, persist?: boolean) => void;
}

interface MainTradingGridState {
  currentBreakpoint: string;
  mounted: boolean;
  windowPopupMap: object;
  gridLayout: any[];
  dragKey: string;
}

class MainTradingGrid extends React.Component<
  Partial<MainTradingGridProps>,
  MainTradingGridState
> {
  static defaultProps = {
    breakpoints: MainGridBreakPoints,
    layouts: MainGridLayout,
    margin: [5, 5],
  };

  state = {
    currentBreakpoint: "",
    mounted: false,
    windowPopupMap: {},
    gridLayout: [],
    dragKey: "",
  };

  constructor(props) {
    super(props);

    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    this.onWidthChange = this.onWidthChange.bind(this);
    this.setPopupMap = this.setPopupMap.bind(this);
    this.onItemUpdateSizeStop = this.onItemUpdateSizeStop.bind(this);
    this.onItemUpdateSize = this.onItemUpdateSize.bind(this);
  }

  onItemUpdateSize(layout, oldItem) {
    const { dragKey } = this.state;

    if (dragKey) return;

    this.setState({
      dragKey: oldItem.i,
    });
  }

  onItemUpdateSizeStop(layout, oldItem) {
    this.setState({
      dragKey: "",
    });
  }

  setPopupMap(obj) {
    this.setState({
      windowPopupMap: obj,
    });
  }

  onBreakpointChange(breakpoint: string) {
    const { layouts, enabledWorkspaces } = this.props;

    this.setState({
      currentBreakpoint: breakpoint,
      gridLayout: this.updateLayout(enabledWorkspaces, layouts[breakpoint]),
    });
  }

  onWidthChange(width: number) {
    const { currentBreakpoint } = this.state;
    const { breakpoints, layouts, enabledWorkspaces } = this.props;

    if (currentBreakpoint === "") {
      // The very first time.
      // Compute the initial breakpoint.
      const sortedBreakpoints = Object.keys(breakpoints).sort(
        (breakpoint1, breakpoint2) =>
          breakpoints[breakpoint1] - breakpoints[breakpoint2]
      );
      let breakpoint = sortedBreakpoints[0];

      for (let i = 0; i < sortedBreakpoints.length; i++) {
        const currentBreakpoint = sortedBreakpoints[i];
        const nextBreakpoint = sortedBreakpoints[i + 1];
        if (
          typeof nextBreakpoint === "undefined" ||
          (breakpoints[currentBreakpoint] <= width &&
            width <= breakpoints[nextBreakpoint])
        ) {
          breakpoint = currentBreakpoint;
          break;
        }
      }

      this.setState({
        currentBreakpoint: breakpoint,
        gridLayout: this.updateLayout(enabledWorkspaces, layouts[breakpoint]),
      });
    }
  }

  componentDidUpdate(
    prevProps: MainTradingGridProps,
    prevState: MainTradingGridState
  ) {
    if (
      !shallowCompareArrays(prevProps.orderEntries, this.props.orderEntries) ||
      !shallowCompareObjects(
        prevProps.enabledWorkspaces,
        this.props.enabledWorkspaces
      ) ||
      !shallowCompareObjects(prevProps.layouts, this.props.layouts) ||
      prevState.currentBreakpoint !== this.state.currentBreakpoint ||
      prevState.dragKey !== this.state.dragKey
    ) {
      this.setState({
        gridLayout: this.updateLayout(
          this.props.enabledWorkspaces,
          this.props.layouts[this.state.currentBreakpoint] || []
        ),
      });
    }
  }

  // renderElemetns() {
  //   const { enabledWorkspaces } = this.props;

  //   return this.updateLayout(enabledWorkspaces, gridLayout)
  // }

  private updateLayout(
    enabledWorkspaces: WorkspaceSetting,
    layoutSetting: {
      i: WorkspaceSettingEnum;
      x: number;
      y: number;
      w: number;
      h: number;
      minW: number;
      minH: number;
    }[] = []
  ) {
    const { windowPopupMap, dragKey } = this.state;
    const { tradeType, orderEntries } = this.props;
    if (!layoutSetting.length) return [];

    const layout = [];

    for (let _i = 0; _i < layoutSetting.length; _i++) {
      const key = layoutSetting[_i].i;
      const element = this.getGridElementByKey(key);

      if (enabledWorkspaces[key] && element) {
        const className = dragKey === key ? "react-grid-item--dragging" : "";

        layout.push(
          windowPopupMap[key] ? (
            element
          ) : (
            <div key={key} data-grid={layoutSetting[_i]} className={className}>
              {element}
            </div>
          )
        );
      }
    }

    // for (let _i = 0; _i < orderEntries.length; _i++) {
    //   const entry = orderEntries[_i];
    //   layout.push(
    //     <div
    //       key={_i}
    //       data-grid={{ x: 0, y: _i * 30, w: 4, h: 30, minH: 14, minW: 3 }}
    //     >
    //       <OrderForm
    //         wallet={getWalletIdFromName(tradeType)}
    //         formId={entry.formId}
    //         pair={entry.symbol}
    //         expiryDate={entry.expiryDate}
    //         isDraggable={true}
    //       />
    //     </div>
    //   );
    // }

    return layout;
  }

  private getGridElementByKey(key: WorkspaceSettingEnum): ReactNode {
    const { tradeType, symbol, closeElement } = this.props;
    const { windowPopupMap } = this.state;

    // const onChildPopupOpen = (windownRef) => {
    //   this.setPopupMap({
    //     ...windowPopupMap,
    //     [key]: windownRef
    //   });
    // }

    // const onDestroyChildPopup = () => {
    //   this.setPopupMap({
    //     ...windowPopupMap,
    //     [key]: undefined
    //   });
    // }

    const item = getCardInnerByKey(key, symbol, tradeType, windowPopupMap[key]);
    const title = getCardNameByKey(key);
    /**
     * windowPopupMap[key] ?
      <NewWindow key={key} title={title} name={key} width={key === WorkspaceSettingEnum.MARKET_HISTORY ? 970 : undefined} onOpen={onChildPopupOpen} onUnload={onDestroyChildPopup} onBlock={onDestroyChildPopup}>
        {item}
      </NewWindow>
      : 
     */
    return (
      <div className="react-grid-item__section">
        {key === WorkspaceSettingEnum.MARKET_HISTORY ? (
          item
        ) : key === WorkspaceSettingEnum.ORDERBOOK ? (
          <Card
            cardIdentify={key}
            title={title}
            closable={true}
            onClose={closeElement}
            titleClickable={true}
            className="order-book"
            rightTool={
              <IconButton
                id="cog"
                onClick={() =>
                  document
                    .querySelector("#oob__container")
                    .requestFullscreen({ navigationUI: "show" })
                }
              />
            }
            // rightTool={getCardToolByKey(key)}
            contentPadding={getCardContentPaddingByKey(key)}
          >
            {item}
          </Card>
        ) : (
          <Card
            cardIdentify={key}
            title={title}
            closable={true}
            onClose={closeElement}
            rightTool={getCardToolByKey(key)}
            contentPadding={getCardContentPaddingByKey(key)}
          >
            {item}
          </Card>
        )}
      </div>
    );
  }

  componentDidMount() {
    const { setFullScreenMode } = this.props;
    console.log(this.props.orderEntries.length);
    document.addEventListener("fullscreenchange", function () {
      var full_screen_ele = document.fullscreenElement;

      if (full_screen_ele !== null) setFullScreenMode(true);
      else setFullScreenMode(false);
    });

    this.setState({
      mounted: true,
    });
  }

  componentWillUnmount(): void {
    document.removeEventListener("fullscreenchange", function () {
      console.log("Successfully removed");
    });
  }

  render() {
    const { layouts, breakpoints, margin } = this.props;
    const { mounted } = this.state;

    return (
      <ResponsiveReactGridLayout
        rowHeight={GRID_ROW_HEIGHT}
        className="layout"
        layouts={layouts}
        onDragStop={this.onItemUpdateSizeStop}
        onDrag={this.onItemUpdateSize}
        onResize={this.onItemUpdateSize}
        onResizeStop={this.onItemUpdateSizeStop}
        draggableHandle=".card__title__ctn.draggable"
        breakpoints={breakpoints}
        cols={COLS}
        onWidthChange={this.onWidthChange}
        onBreakpointChange={this.onBreakpointChange}
        // onLayoutChange={(layout) => console.log('onLayoutChange', layout)}
        measureBeforeMount={false}
        useCSSTransforms={mounted}
        margin={margin}
      >
        {this.updateLayout(
          this.props.enabledWorkspaces,
          this.props.layouts[this.state.currentBreakpoint] || []
        )}
      </ResponsiveReactGridLayout>
    );
  }
}

const mapStateToProps = (state) => ({
  enabledWorkspaces: omitWorkspace(getSetting(state)("enabled_workspaces")),
  orderEntries: getOrderEntries(state),
});

const mapDispatchToProps = (dispatch) => ({
  closeElement: function (key: WorkspaceSettingEnum, persist = false) {
    dispatch(toggleWorkspaceSetting({ key, persist }));
  },
  setFullScreenMode: function (status?: boolean, persist = false) {
    dispatch(
      setFullScreenMode({
        key: "set_fullscreen_mode",
        status,
        persist,
      })
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MainTradingGrid);
