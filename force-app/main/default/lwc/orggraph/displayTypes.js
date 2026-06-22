const getMainHorizontalDefinition = (go) => {
    var result = {
        isInitial: false,
        isOngoing: false,
        treeStyle: go.TreeLayout.StyleLayered,
        arrangement: go.TreeLayout.ArrangementHorizontal,
        arrangementSpacing: new go.Size(75, 75),
        angle: 90,
        layerSpacing: 40,
        nodeSpacing: 40
    };

    return result;
};

const getVerticalLeafDefinition = (go) => {
    var result = {
        isInitial: false,
        isOngoing: false,
        treeStyle: go.TreeLayout.StyleLastParents,
        arrangement: go.TreeLayout.ArrangementHorizontal,
        arrangementSpacing: new go.Size(75, 75),

        // Properties for most of the tree:
        angle: 90,
        layerSpacing: 40,
        nodeSpacing: 40,

        // Properties for the "last parents":
        alternateAngle: 0,
        alternateAlignment: go.TreeLayout.AlignmentStart,
        alternateNodeIndentPastParent: 1.0,
        alternateNodeIndent: 40,
        alternateLayerSpacing: 40,
        alternateNodeSpacing: 40,
        alternateLayerSpacingParentOverlap: 0.8,
        alternatePortSpot: new go.Spot(0.08, 0.945, 10, 0),
        alternateChildPortSpot: go.Spot.Left
    };

    return result;
};

const getHorizontalDefinition = (go) => {
    var result = {
        isInitial: false,
        isOngoing: false,
        treeStyle: go.TreeLayout.StyleLayered,
        alignment: go.TreeLayout.AlignmentCenterChildren,
        arrangement: go.TreeLayout.ArrangementHorizontal,
        arrangementSpacing: new go.Size(40, 40),
        angle: 90,
        layerSpacing: 40,
        nodeSpacing: 40
    };

    return result;
};

const getVerticalDefinition = (go) => {
    var result = {
        isInitial: false,
        isOngoing: false,
        treeStyle: go.TreeLayout.StyleLayered,
        alignment: go.TreeLayout.AlignmentBottomRightBus,
        arrangement: go.TreeLayout.ArrangementVertical,
        arrangementSpacing: new go.Size(40, 40),
        angle: 90,
        layerSpacing: 40,
        nodeSpacing: 40
    };

    return result;
};

export { getMainHorizontalDefinition, getVerticalLeafDefinition, getHorizontalDefinition, getVerticalDefinition };