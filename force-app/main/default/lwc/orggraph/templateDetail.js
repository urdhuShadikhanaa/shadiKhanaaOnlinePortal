import STYLE from './style.js';
import { isLightColor } from 'c/utils';

const templateDetail = (
    go,
    $,
    self,
    handleNodeDetailViewClicked,
    extendedFieldsTemplate,
    extendedFieldsTopTemplate,
    extendedFieldsTopForUrlTemplate,
    svgAvatarUrl,
    badgeTemplate
) => {
    const template = $(
        go.Node,
        'Spot',
        {
            doubleClick: handleNodeDetailViewClicked,
            mouseDragEnter: (e, node) => {
                var selection = node.diagram.selection;

                if (!self.canDropNodes(selection, node)) {
                    return;
                }
                node.isHighlighted = true;
                let object = node.findObject('NODEBASESHAPE');

                if (object) {
                    object.fill = STYLE.NODE_HIGHLIGHT_COLOR;
                }
                self.lightenNodes(selection);
            },
            mouseDragLeave: (e, node) => {
                node.isHighlighted = false;
                self.darkenNodes(node.diagram.selection);
            },
            mouseDrop: (e, node) => {
                node.isHighlighted = false;
                self.handleNodeDropped(node);
                self.darkenNodes(node.diagram.selection);
            },
            selectionChanged: (part) => {
                part.linksConnected.each(function (link) {
                    link.isHighlighted = part.isSelected;
                });
            },
            name: 'STAKEHOLDER',
            contextMenu: self.mainContextMenu,
            selectionAdorned: false,
            zOrder: 20,
            isShadowed: true,
            shadowColor: '#999',
            shadowBlur: 20,
            shadowOffset: new go.Point(0, 0),
            portId: '__standard',
            fromSpot: new go.Spot(0.5, 1, 0, 8.5 - STYLE.NODE_SELECTED_BOUNDARY_SIZE), // Bottom
            toSpot: new go.Spot(0.5, 0, 0, 3 + STYLE.NODE_SELECTED_BOUNDARY_SIZE), // Top
            fromLinkable: false,
            toLinkable: false,
            fromLinkableSelfNode: false,
            toLinkableSelfNode: false,
            fromLinkableDuplicates: false,
            toLinkableDuplicates: false
        },
        new go.Binding('shadowColor', 'isSelected', (sel) => {
            return sel ? '#ccc' : '#999';
        }).ofObject(),
        new go.Binding('layerName', 'isSelected', (sel) => {
            return sel ? 'Foreground' : '';
        }).ofObject(),
        new go.Binding('zOrder', 'isSelected', (sel) => {
            return sel ? 25 : 20;
        }).ofObject(),
        new go.Binding('location', 'location', (loc) => {
            return new go.Point(loc.x, loc.y);
        }).makeTwoWay((newLoc) => {
            return {
                x: newLoc.x,
                y: newLoc.y
            };
        }),

        // Wrapper for Selection Highlight
        $(
            go.Panel,
            'Auto',
            { stretch: go.GraphObject.Fill },
            $(
                go.Shape,
                'RoundedRectangle',
                {
                    parameter1: STYLE.NODE_CORNER_RADIUS,
                    fill: 'transparent',
                    strokeWidth: 0,
                    shadowVisible: false,
                    stretch: go.GraphObject.Fill,
                    contextMenu: false
                },
                new go.Binding('fill', 'isSelected', (h) => {
                    return h ? STYLE.NODE_SELECTED_UNDERLAY_COLOR : 'transparent';
                }).ofObject('')
            ),

            // Surrounding Content
            $(
                go.Panel,
                'Spot',
                { stretch: go.GraphObject.Fill, margin: new go.Margin(1.5 * STYLE.NODE_SELECTED_BOUNDARY_SIZE) },

                // Custom relationship links root to the shape
                $(
                    go.Shape,
                    'RoundedRectangle',
                    {
                        name: 'NODEBASESHAPE',
                        portId: self._relLinkPort,
                        fromLinkableSelfNode: false,
                        toLinkableSelfNode: false,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Fill,
                        parameter1: STYLE.NODE_CORNER_RADIUS,
                        fill: '#fff',
                        stroke: STYLE.NODE_STROKE_COLOR,
                        strokeWidth: 0,
                        fromLinkable: true,
                        toLinkable: true,
                        fromLinkableDuplicates: true,
                        toLinkableDuplicates: true,
                        shadowVisible: true
                    },
                    new go.Binding('fill', 'isHighlighted', (h) => {
                        return h ? STYLE.NODE_HIGHLIGHT_COLOR : '#fff';
                    }).ofObject('')
                ),

                // Head Panel Backing
                $(
                    go.Shape,
                    'RoundedRectangle',
                    {
                        name: 'KSIconPanel',
                        alignment: go.Spot.Left,
                        alignmentFocus: new go.Spot(0, 0.5, 0, 0),
                        parameter1: STYLE.NODE_CORNER_RADIUS,
                        fill: STYLE.NODE_HEAD_COLOR,
                        stroke: STYLE.NODE_STROKE_COLOR,
                        strokeWidth: 0,
                        visible: true,
                        width: STYLE.NODE_HEAD_PANEL_MIN_WIDTH,
                        stretch: go.GraphObject.Fill
                    },
                    new go.Binding('fill', 'supportColor', (val) => {
                        return val ? val : STYLE.NODE_HEAD_COLOR;
                    })
                ),

                // Head Panel Backing Right Edge
                $(
                    go.Shape,
                    'Rectangle',
                    {
                        name: 'HeadRightEdge',
                        alignment: go.Spot.Left,
                        alignmentFocus: new go.Spot(
                            0,
                            0.5,
                            -1 * (STYLE.NODE_HEAD_PANEL_MIN_WIDTH - STYLE.NODE_CORNER_RADIUS),
                            0
                        ),
                        fill: STYLE.NODE_HEAD_COLOR,
                        stroke: STYLE.NODE_STROKE_COLOR,
                        strokeWidth: 0,
                        visible: true,
                        width: Math.abs(STYLE.NODE_CORNER_RADIUS + STYLE.NODE_STROKE_WIDTH),
                        stretch: go.GraphObject.Fill
                    },
                    new go.Binding('fill', 'supportColor', (val) => {
                        return val ? val : STYLE.NODE_HEAD_COLOR;
                    })
                ),

                // Headshot/Profile Image URL
                $(
                    go.Panel,
                    'Spot',
                    {
                        background: 'transparent',
                        visible: true,
                        alignment: go.Spot.Left,
                        alignmentFocus: new go.Spot(0.5, 0.5, -1 * (STYLE.NODE_HEAD_PANEL_MIN_WIDTH / 2), 0)
                    },

                    $(go.Shape, 'Circle', {
                        visible: true,
                        alignment: go.Spot.Left,
                        width: STYLE.NODE_HEAD_ICON_WIDTH + 2,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT + 2,
                        strokeWidth: 2,
                        stroke: '#fff',
                        fill: '#fff'
                    }),

                    $(
                        go.Panel,
                        'Spot',
                        {
                            isClipping: true,
                            visible: true
                        },
                        $(go.Shape, 'Circle', { width: 70, strokeWidth: 0 }),
                        $(go.Picture, {
                            width: STYLE.NODE_HEAD_ICON_WIDTH,
                            height: STYLE.NODE_HEAD_ICON_HEIGHT,

                            // The desiredSize must match the width & height inside the SVG file
                            desiredSize: new go.Size(80, 80),
                            source: svgAvatarUrl
                        }),
                        new go.Binding('visible', 'profileImageUrlOrData', (profileImageUrlData) => {
                            if (profileImageUrlData && profileImageUrlData.length > 0) {
                                return false;
                            }

                            return true;
                        })
                    )
                ),
                $(
                    go.Panel,
                    'Spot',
                    {
                        cursor: 'pointer',
                        width: STYLE.NODE_HEAD_ICON_WIDTH,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT,
                        background: 'transparent',
                        isClipping: true,
                        alignment: go.Spot.Left,
                        alignmentFocus: new go.Spot(0.5, 0.5, -1 * (STYLE.NODE_HEAD_PANEL_MIN_WIDTH / 2), 0),
                        mouseEnter: (e, panel) => {
                            const shape = panel.findObject('HEADSHOT_OVERLAY');

                            if (shape) {
                                shape.opacity = 0.5;
                            }
                        },
                        mouseLeave: (e, panel) => {
                            const shape = panel.findObject('HEADSHOT_OVERLAY');

                            if (shape) {
                                shape.opacity = 0.0;
                            }
                        }
                    },
                    $(go.Shape, 'Circle', {
                        width: STYLE.NODE_HEAD_ICON_WIDTH,
                        height: STYLE.NODE_HEAD_ICON_HEIGHT,
                        background: 'transparent',
                        strokeWidth: 2,
                        stroke: '#00f',
                        cursor: 'pointer'
                    }),
                    $(
                        go.Picture,
                        {
                            width: STYLE.NODE_HEAD_ICON_WIDTH,
                            height: STYLE.NODE_HEAD_ICON_HEIGHT,
                            cursor: 'pointer'
                        },
                        new go.Binding('source', 'profileImageUrlOrData')
                    )
                ),

                // Main content panel area for the node
                $(
                    go.Panel,
                    'Table',
                    { isPanelMain: true, stretch: go.GraphObject.Fill },

                    $(go.RowColumnDefinition, {
                        column: 0,
                        width: STYLE.NODE_HEAD_PANEL_MIN_WIDTH + STYLE.NODE_CORNER_RADIUS
                    }),
                    $(go.RowColumnDefinition, { column: 1, minimum: STYLE.NODE_CONTENT_PANEL_WIDTH }),
                    $(go.RowColumnDefinition, { column: 2, width: STYLE.NODE_CORNER_RADIUS }),

                    // Top padding blockout
                    $(go.Shape, 'Rectangle', {
                        row: 0,
                        column: 1,
                        stretch: go.GraphObject.Horizontal,
                        margin: new go.Margin(0, 0, 0, 0),
                        height: 30,
                        strokeWidth: 0,
                        fill: 'transparent'
                    }),

                    // Primary Fields
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            row: 1,
                            column: 1,
                            alignment: go.Spot.Left,
                            stretch: go.GraphObject.Horizontal,
                            cursor: 'pointer'
                        },
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Left,
                                padding: new go.Margin(0, 15, 5, 0)
                            },
                            $(
                                go.TextBlock,
                                {
                                    font: STYLE.NODE_NAME_FONT,
                                    alignment: go.Spot.Left,
                                    textAlign: 'left',
                                    stroke: STYLE.NODE_NAME_COLOR,
                                    shadowVisible: false
                                },
                                new go.Binding('text', 'name')
                            )
                        ),
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Left,
                                padding: new go.Margin(0, 15, 5, 0)
                            },
                            $(
                                go.TextBlock,
                                {
                                    font: STYLE.NODE_TITLE_FONT,
                                    alignment: go.Spot.Left,
                                    textAlign: 'left',
                                    stroke: STYLE.NODE_TITLE_COLOR,
                                    visible: false,
                                    shadowVisible: false
                                },
                                new go.Binding('text', 'title'),
                                new go.Binding('visible', 'title', (ttl) => {
                                    return ttl !== null && ttl !== '';
                                })
                            )
                        ),

                        // Additional Fields to be in the main section
                        $(
                            go.Panel,
                            'Vertical',
                            {
                                margin: new go.Margin(10, 0, 0, 0),
                                stretch: go.GraphObject.Horizontal, // Take up whole available width
                                defaultAlignment: go.Spot.Left, // Thus no need to specify alignment on each element
                                itemTemplate: extendedFieldsTopTemplate // The Panel created for each item in Panel.itemArray
                            },
                            new go.Binding('visible', 'additionalFields', (fields) => {
                                if (!Array.isArray(fields)) {
                                    return false;
                                }

                                return fields.some((item) => {
                                    if (item.isMainSection) {
                                        return true;
                                    }

                                    return false;
                                });
                            }),
                            new go.Binding('itemArray', 'additionalFields')
                        )
                    ),

                    // Middle padding blockout
                    $(
                        go.Shape,
                        'Rectangle',
                        {
                            row: 2,
                            column: 1,
                            stretch: go.GraphObject.Horizontal,
                            margin: new go.Margin(0, 0, 0, 0),
                            height: 50,
                            strokeWidth: 0,
                            fill: 'transparent',
                            visible: false
                        },
                        new go.Binding('visible', 'hasInfluenceSupport', (val) => {
                            return val;
                        })
                    ),

                    // Influence and Support - as long as either Influence or Support are defined for the node, display the block
                    $(
                        go.Panel,
                        'Vertical',
                        {
                            row: 3,
                            column: 1,
                            alignment: go.Spot.Left,
                            margin: new go.Margin(5, 0, 0, 0),
                            visible: false
                        },
                        new go.Binding('visible', 'hasInfluenceSupport', (val) => {
                            return val;
                        }),
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Left,
                                margin: new go.Margin(0, 0, 0, 0),
                                cursor: 'pointer'
                            },

                            // Display the Picture only if the InfluenceImageUrl property is present
                            $(
                                go.Picture,
                                {
                                    desiredSize: new go.Size(NaN, STYLE.NODE_SUPPORT_DEFAULT_IMAGE_HEIGHT),
                                    imageStretch: go.GraphObject.Uniform,
                                    visible: false,
                                    margin: new go.Margin(0, 5, 0, 0)
                                },
                                new go.Binding('source', 'influenceImageUrl'),
                                new go.Binding('visible', 'hasInfluenceImageUrl', (val) => {
                                    return val;
                                })
                            ),

                            // Display the Support Picture if the SupportImageUrl property is present
                            $(
                                go.Picture,
                                {
                                    desiredSize: new go.Size(NaN, STYLE.NODE_SUPPORT_DEFAULT_IMAGE_HEIGHT),
                                    imageStretch: go.GraphObject.Uniform,
                                    visible: false,
                                    margin: new go.Margin(0, 0, 0, 0)
                                },
                                new go.Binding('source', 'supportImageUrl'),
                                new go.Binding('visible', 'hasSupportImageUrl', (val) => {
                                    return val;
                                })
                            ),

                            //  Display the Support Graphic only if the SupportImageUrl is not present
                            $(
                                go.Panel,
                                'Auto',
                                {
                                    alignment: go.Spot.Center
                                },
                                new go.Binding('visible', 'hasSupportImageUrl', (val) => {
                                    return !val;
                                }),
                                $(
                                    go.Shape,
                                    'RoundedRectangle',
                                    {
                                        stretch: go.GraphObject.Horizontal,
                                        stroke: 'transparent',
                                        strokeWidth: 0,
                                        margin: new go.Margin(0, 0, 0, 0),
                                        fill: STYLE.NODE_SUPPORT_DEFAULT_BUTTON_COLOR,
                                        height: STYLE.NODE_SUPPORT_DEFAULT_BUTTON_HEIGHT,
                                        visible: false,
                                        shadowVisible: false
                                    },
                                    new go.Binding('fill', 'supportColor', (val) => {
                                        if (val && val.length > 0) {
                                            return val;
                                        }

                                        return STYLE.NODE_SUPPORT_DEFAULT_BUTTON_COLOR;
                                    }),
                                    new go.Binding('visible', 'supportLabel', (val) => {
                                        if (val && val.length > 0) {
                                            return true;
                                        }

                                        return false;
                                    })
                                ),
                                $(
                                    go.TextBlock,
                                    {
                                        // Support Text ie CHAMPION, SUPPORTER, BLOCKER
                                        font: 'bold 12pt sans-serif',
                                        stroke: STYLE.NODE_SUPPORT_DEFAULT_BUTTON_FONT_COLOR,
                                        alignment: go.Spot.Center,
                                        alignmentFocus: new go.Spot(0.5, 0.5, 0, -1),
                                        margin: new go.Margin(2, 5, 0, 5),
                                        visible: false
                                    },
                                    new go.Binding('text', 'supportLabel', (val) => {
                                        return val.toUpperCase();
                                    }),
                                    new go.Binding('stroke', 'supportColor', (val) => {
                                        const color = val;
                                        let textColor = STYLE.NODE_NAME_COLOR;

                                        if (color) {
                                            textColor = isLightColor(color) ? '#000000' : '#ffffff';
                                        }

                                        return textColor;
                                    }),
                                    new go.Binding('visible', 'supportLabel', (val) => {
                                        if (val && val.length > 0) {
                                            return true;
                                        }

                                        return false;
                                    })
                                )
                            )
                        ),

                        // Influence Text
                        // Show the textual components only if there is no custom icon URL defined for the org
                        $(
                            go.Panel,
                            'Horizontal',
                            {
                                alignment: go.Spot.Left,
                                margin: new go.Margin(10, 0, 0, 0),
                                cursor: 'pointer'
                            },
                            $(
                                go.Panel,
                                'Horizontal',
                                { alignment: go.Spot.Left, visible: false },
                                $(
                                    go.TextBlock,
                                    { font: 'bold 13pt sans-serif' },
                                    new go.Binding('text', 'influenceLabel', (val) => {
                                        return val;
                                    })
                                ),
                                new go.Binding('visible', 'influenceLabel', (val) => {
                                    if (val && val.length > 0) {
                                        return true;
                                    }

                                    return false;
                                })
                            )
                        )
                    ),

                    // Social Icons
                    $(
                        go.Panel,
                        'Horizontal',
                        {
                            row: 4,
                            column: 1,
                            alignment: go.Spot.Right,
                            shadowVisible: false,
                            margin: new go.Margin(10, 0, 0, 0),
                            stretch: go.GraphObject.Horizontal,
                            itemTemplate: extendedFieldsTopForUrlTemplate
                        },
                        new go.Binding('visible', 'additionalFields', (fields) => {
                            if (!Array.isArray(fields)) {
                                return false;
                            }

                            return fields.some((item) => {
                                if (
                                    item.isMainSection &&
                                    (item.type === 'linkedin' || item.type === 'facebook' || item.type === 'twitter')
                                ) {
                                    return true;
                                }

                                return false;
                            });
                        }),
                        new go.Binding('itemArray', 'additionalFields')
                    ),

                    // Badges
                    $(
                        go.Panel,
                        'Horizontal',
                        {
                            row: 5,
                            column: 1,
                            alignment: go.Spot.Left,
                            shadowVisible: false,
                            margin: new go.Margin(10, 0, 0, 0),
                            stretch: go.GraphObject.Horizontal,
                            itemTemplate: badgeTemplate
                        },
                        new go.Binding('visible', 'badges', (badges) => {
                            if (!Array.isArray(badges)) {
                                return false;
                            }

                            if (badges.length <= 0) {
                                return false;
                            }

                            return true;
                        }),
                        new go.Binding('itemArray', 'badges')
                    ),

                    // Expandable section to show extended/additional field data
                    $(
                        'PanelExpanderButton',
                        'PANEL_EXTENDED_FIELDS', // Name of the object to make visible or invisible
                        {
                            name: 'PANEL_EXTENDED_FIELDS_TOGGLE',
                            row: 18,
                            column: 1,
                            alignment: go.Spot.Center,
                            height: 20,
                            width: 50,
                            margin: new go.Margin(0, 0, 10, 0),
                            visible: false
                        },
                        new go.Binding('visible', 'additionalFields', (fields) => {
                            if (!Array.isArray(fields)) {
                                return false;
                            }

                            return fields.some((item) => {
                                if (!item.isMainSection) {
                                    return true;
                                }

                                return false;
                            });
                        })
                    ),
                    $(
                        go.Panel,
                        'Vertical',
                        { row: 19, column: 1, stretch: go.GraphObject.Horizontal },
                        $(
                            go.Panel,
                            'Vertical',
                            {
                                name: 'PANEL_EXTENDED_FIELDS', // Identify to the PanelExpanderButton
                                visible: false,
                                padding: 2,
                                stretch: go.GraphObject.Horizontal, // Take up whole available width
                                defaultAlignment: go.Spot.Left // Thus no need to specify alignment on each element
                            },
                            $(
                                go.Panel,
                                'Vertical',
                                {
                                    margin: new go.Margin(5, 0, 15, 0),
                                    stretch: go.GraphObject.Horizontal, // Take up whole available width
                                    defaultAlignment: go.Spot.Left, // Thus no need to specify alignment on each element
                                    itemTemplate: extendedFieldsTemplate // The Panel created for each item in Panel.itemArray
                                },
                                new go.Binding('visible', 'additionalFields', (fields) => {
                                    if (!Array.isArray(fields)) {
                                        return false;
                                    }

                                    return fields.some((item) => {
                                        if (!item.isMainSection) {
                                            return true;
                                        }

                                        return false;
                                    });
                                }),
                                new go.Binding('itemArray', 'additionalFields')
                            )
                        )
                    ),

                    // Bottom padding blockout
                    $(
                        go.Shape,
                        'Rectangle',
                        {
                            row: 99,
                            column: 1,
                            stretch: go.GraphObject.Horizontal,
                            margin: new go.Margin(0, 0, 0, 0),
                            strokeWidth: 0,
                            fill: 'transparent'
                        },
                        new go.Binding('height', 'additionalFields', (fields) => {
                            if (!Array.isArray(fields)) {
                                return 30;
                            }
                            let hasFields = fields.some((item) => {
                                if (!item.isMainSection) {
                                    return true;
                                }

                                return false;
                            });

                            return hasFields ? 10 : 30;
                        })
                    )
                )
            )
        ),

        // Overlay Tree Expander
        $('TreeExpanderButton', {
            margin: new go.Margin(4, 0, 0, 0),
            alignment: new go.Spot(0.5, 1, 0, -STYLE.NODE_SELECTED_BOUNDARY_SIZE)
        })
    );

    return template;
};

export { templateDetail };