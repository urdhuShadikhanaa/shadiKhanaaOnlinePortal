import STYLE from './style.js';

const templateGroup = (go, $, events, self, horizontalStyle, verticalStyle) => {
    const template = $(
        go.Group,
        'Auto',
        events,
        {
            background: 'transparent',
            computesBoundsAfterDrag: true,
            handlesDragDropForMembers: true, // Don't need to define handlers on member Nodes and Links
            contextMenu: self.mainContextMenu,
            selectionAdorned: false,
            selectionObjectName: 'PANEL', // Selection handle goes around shape, not label
            ungroupable: true,
            fromLinkable: true,
            toLinkable: true,
            fromLinkableSelfNode: false,
            toLinkableSelfNode: false,
            fromLinkableDuplicates: true,
            toLinkableDuplicates: true,
            selectionChanged: (part) => {
                part.linksConnected.each(function (link) {
                    link.isHighlighted = part.isSelected;
                });
            }
        },
        new go.Binding('layout', 'groupLayout', (gl) => {
            return gl === 'Vertical'
                ? self.goGraphObjectMake(go.TreeLayout, verticalStyle)
                : self.goGraphObjectMake(go.TreeLayout, horizontalStyle);
        }),
        new go.Binding('zOrder', (nodeData) => {
            if (nodeData.key < 0) {
                return self._currentMaxDepth++;
            }
            let depth = self.findGroupDepth(nodeData);

            self._currentMaxDepth = Math.max(self._currentMaxDepth, depth);

            return depth;
        }),
        new go.Binding('location', 'location', (loc) => {
            return new go.Point(loc.x, loc.y);
        }).makeTwoWay((newLoc) => {
            return {
                x: newLoc.x,
                y: newLoc.y
            };
        }),
        $(
            go.Shape,
            'RoundedRectangle',
            {
                strokeWidth: 4
            },
            new go.Binding('fill', 'isHighlighted', function (h) {
                return h ? 'rgba(248, 248, 0)' : 'rgba(248, 248, 248)';
            }).ofObject(),
            new go.Binding('stroke', 'isSelected', function (isSelected) {
                return isSelected ? STYLE.NODE_SELECTED_STROKE_COLOR : 'rgba(216, 216, 216)';
            }).ofObject()
        ),
        $(
            go.Panel,
            'Vertical', // Title above Placeholder
            $(
                go.Panel,
                'Horizontal', // Button next to TextBlock
                {
                    stretch: go.GraphObject.Horizontal,
                    background: 'rgba(216, 216, 216)'
                },
                $('SubGraphExpanderButton', {
                    alignment: go.Spot.Right,
                    margin: 5
                }),
                $(
                    go.TextBlock,
                    {
                        alignment: go.Spot.Left,
                        editable: true,
                        margin: 5,
                        font: 'bold 32px sans-serif',
                        opacity: 1.0,
                        stroke: STYLE.GROUP_TITLE_COLOR,
                        isMultiline: false
                    },
                    new go.Binding('text', 'text').makeTwoWay((newName, groupData) => {
                        const event = new CustomEvent('groupnamechanged', {
                            detail: { groupData: groupData, newName: newName }
                        });

                        self.dispatchEvent(event);
                    })
                ),
                new go.Binding('background', 'isHighlighted', function (h) {
                    return h ? 'rgba(228, 228, 0)' : 'rgba(216, 216, 216)';
                }).ofObject()
            ), // End Horizontal Panel
            $(go.Placeholder, {
                padding: 25,
                alignment: go.Spot.TopLeft
            })
        ) // End Vertical Panel
    );

    // #endregion

    return template;
};

export { templateGroup };