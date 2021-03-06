/**
 * Attention Map visualization
 * @property svg - selection for the svg element which shows the attention map
 * @property graphics - main group for svg elements
 * @property zoom - d3 zoom object
 * @property {number} resizeTimer - id for the timer which checks for changes in box size
 * @property {HTMLImageElement} image - image used to get the natural width and height
 */
class AttentionMap extends Visualization {

    /**
     * @param {Box} box
     */
    constructor(box) {

        /**
         * the third parameter is used as a identifier for the HTML
         * object so that it can be modified easily from the code
         * Such modicaitons can be as adding a loader
         */
        super(box, 'Attention Map', 'atviz');

        this.width = this.box.inner.offsetWidth;
        this.height = this.box.inner.offsetHeight;

        this.svg = d3.select(this.box.inner)
            .classed('smalldot ', true)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .on('contextmenu', d3.contextMenu(this.createMenu()));

        this.graphics = this.svg.append('g');

        this.zoom = d3.zoom();
        this.svg.call(
            this.zoom.on('zoom', () => {
                this.graphics.attr('transform', d3.event.transform);
                if(d3.event.transform.ignore)
                    return;
                let visualization = registry.getVisualizationInstance('editor');
                if(visualization) visualization.syncZoom(d3.event.transform);
            })
        );
        this.zoom.filter(() => (d3.event.type === 'mousedown' && d3.event.button === 1) || (d3.event.type === 'wheel' && d3.event.button === 0));
        this.hasBeenCentered = false;

        this.resizeTimer = setInterval(() => {
            if (this.width !== this.box.inner.offsetWidth || this.height !== this.box.inner.offsetHeight) {
                this.hasBeenCentered ? this.maintainTransform(this.box.inner.offsetWidth, this.box.inner.offsetHeight) : this.center();
                this.width = this.box.inner.offsetWidth;
                this.height = this.box.inner.offsetHeight;
                this.svg
                    .attr('width', this.width)
                    .attr('height', this.height);
            }
        }, 100);

        this.image = new Image();
        this.image.onload = () => {
            this.hasBeenCentered = false;
            this.draw();
            this.center();
        }

        properties.setListener('attentionmap', 'image', () => this.image.src = properties.image ? dataset.url + '/images/' + properties.image : '');
        properties.setListener('attentionmap', ['color','users','aoi'], () => this.draw());

        if (properties.image)
            this.image.src = dataset.url + '/images/' + properties.image;
            
    }

    syncZoom(zoomCord){
        zoomCord.ignore = true;
        this.svg.call(this.zoom.transform, zoomCord);
    }

    /**
     * Draws the attention map on the canvas
     */
    draw() {
        this.graphics.selectAll('*').remove();

        if (!properties.image)
            return;

        this.graphics.append('image')
            .attr('xlink:href', this.image.src)
            .attr('width', this.image.naturalWidth)
            .attr('height', this.image.naturalHeight);

        const imageData = dataset.getImageData(properties.image);

        let points = [];
        imageData.scanpaths.forEach(path => {
            if (properties.users.includes(path.person))
                points = points.concat(path.points);
        });

        // remove points not in the AOIs
        if(properties.getCurrentAOI().length) {
            loop: for (let i = 0; i < points.length; i++) {
                for (let aoi of properties.getCurrentAOI()) {
                    if (aoi.includesPoint(points[i]))
                        continue loop;
                }
                points.splice(i, 1);
                i--;
            }
        }

        let contours = d3.contourDensity()
            .x(point => point.x)
            .y(point => point.y)
            .size([this.image.naturalWidth, this.image.naturalHeight])
            .bandwidth(20)(points);

        let color = d3.scalePow().domain([0, d3.max(contours, d => d.value)]).range(['#ffffff00', properties.getColorHex()]);

        this.graphics.append('g')
            .attr('fill', 'none')
            .attr('stroke', 'none')
            .attr('stroke-linejoin', 'round')
            .selectAll('path')
            .data(contours)
            .enter().append('path')
            .attr('fill', d => color(d.value))
            .attr('stroke-width', (d, i) => i % 5 ? 0.25 : 1)
            .attr('d', d3.geoPath());
    }

    /**
     * Centers the attention map on the box
     */
    center() {
        if (this.width === 0 || this.height === 0 || this.image.naturalWidth === 0 || this.image.naturalHeight === 0)
            return;

        let scale = Math.min(this.width / this.image.naturalWidth, this.height / this.image.naturalHeight);
        this.svg.call(this.zoom.translateTo, this.image.naturalWidth / 2, this.image.naturalHeight / 2);
        this.svg.call(this.zoom.scaleTo, scale);

        this.hasBeenCentered = true;
    }

    /**
     * Makes sure translation and scale stays the same when resized
     * @param {number} newWidth - new box width
     * @param {number} newHeight - new box height
     */
    maintainTransform(newWidth, newHeight) {
        let scale = d3.zoomTransform(this.svg.node()).k;
        this.svg.call(this.zoom.translateBy, (newWidth - this.width) / 2 / scale, (newHeight - this.height) / 2 / scale);
    }

    /**
     * Creates the context menu
     * @return {({title?: string, action?: function()} | {divider: boolean})[]}
     */
    createMenu(){
        let menu = [];
        menu.push({
            title: 'Download as image',
            action: () => {
                downloadSVG(this.svg.node(), 'Attention Map');
            }
        })
        return menu;
    }

    onRemoved() {
        if (this.resizeTimer)
            clearInterval(this.resizeTimer);
    }
}