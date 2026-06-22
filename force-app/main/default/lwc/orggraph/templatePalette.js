const templatePalette = (go, $, self, handleNodeDetailViewClicked) => {
    const template = $(
        go.Node,
        'Auto',
        {
            doubleClick: handleNodeDetailViewClicked,
            locationSpot: go.Spot.TopCenter,
            isShadowed: true,
            shadowBlur: 2,
            shadowOffset: new go.Point(1, 1),
            shadowColor: 'rgba(0, 0, 0, .15)',
            selectionAdorned: false
        },
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
                name: 'SHAPE',
                strokeWidth: 0,
                parameter1: 4, // Set the rounded corner
                spot1: go.Spot.TopLeft,
                spot2: go.Spot.BottomRight,
                width: 240,
                minSize: new go.Size(NaN, 48)
            },
            new go.Binding('fill', 'isSelected', (sel) => {
                return sel ? '#ccc' : '#fff';
            }).ofObject()
        ),
        $(
            go.Panel,
            'Horizontal',
            {
                stretch: go.GraphObject.Vertical,
                cursor: 'pointer'
            },
            $(
                go.Panel,
                'Spot',
                {
                    background: 'transparent',
                    alignment: go.Spot.Left,
                    mouseEnter: (e, panel) => {
                        const shape = panel.findObject('HEADSHOT_OVERLAY');

                        if (shape) {
                            shape.opacity = 0.7;
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
                    visible: true,
                    alignment: go.Spot.Left,
                    width: 30,
                    height: 30,
                    background: 'transparent',
                    strokeWidth: 0,
                    stroke: '#fff',
                    fill: '#989898'
                }),
                $(go.Shape, {
                    // Headshot/Profile Default Icon
                    geometryString:
                        'F M 22.55,8.59c0,4.74-3.24,8.58-7.23,8.58S8.08,13.33,8.08,8.59,11.32,0,15.32,0,22.55,3.84,22.55,8.59ZM.1,27.83c-1.07-3.94,6.54-10.09,10-8.74.88.34.82.9,2.21,1.58a7,7,0,0,0,6.1.12c1.32-.68,1.22-1.34,2.1-1.7,3.27-1.37,11.09,5.21,9.9,9-.7,2.23-4.45,3-7.82,3.77a35.59,35.59,0,0,1-7.27.55c-4.31.07-6.51.09-8.86-.6S.72,30.11.1,27.83Z',
                    width: 30 * 0.45,
                    height: 30 * 0.45,
                    alignment: go.Spot.Center,
                    fill: '#fff',
                    stroke: 'transparent',
                    strokeWidth: 0,
                    name: 'KSProfileIcon',
                    visible: true
                })
            ),
            $(
                go.Panel,
                'Vertical',
                {
                    alignment: go.Spot.Left,
                    stretch: go.GraphObject.Horizontal,
                    cursor: 'pointer',
                    padding: new go.Margin(10, 20, 10, 20),
                    background: 'transparent',
                    width: 200
                },
                $(
                    go.TextBlock,
                    {
                        font: 'bold 9pt sans-serif',
                        stretch: go.GraphObject.Horizontal
                    },
                    new go.Binding('text', 'name')
                ),
                $(
                    go.TextBlock,
                    {
                        font: '7pt sans-serif',
                        visible: false,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Horizontal,
                        stroke: '#666'
                    },
                    new go.Binding('text', 'title'),
                    new go.Binding('visible', 'title', (ttl) => {
                        return ttl !== null && ttl !== '';
                    })
                ),
                $(
                    go.TextBlock,
                    {
                        font: '7pt sans-serif',
                        visible: false,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Horizontal,
                        stroke: '#666'
                    },
                    new go.Binding('text', 'accountName'),
                    new go.Binding('visible', 'accountName', (ttl) => {
                        return ttl !== null && ttl !== '';
                    })
                ),
                $(
                    go.TextBlock,
                    {
                        font: '7pt sans-serif',
                        visible: false,
                        cursor: 'pointer',
                        stretch: go.GraphObject.Horizontal,
                        stroke: '#666'
                    },
                    new go.Binding('text', (nodeData) => {
                        if (nodeData.reportsTo) {
                            return self.labels.reportsTo + ' ' + nodeData.reportsTo;
                        }

                        return '';
                    }),
                    new go.Binding('visible', 'reportsTo', (reportsTo) => {
                        return reportsTo !== null && reportsTo !== '';
                    })
                )
            )
        )
    );

    return template;
};

export { templatePalette };