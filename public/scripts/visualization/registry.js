/**
 * Registry for all visualizations
 * @property {Map<string,VisualizationType>} map - map for all visualization types
 */
class Registry {

    constructor() {
        this.map = new Map();
    }

    /**
     * All Visualizations need to be registered through this method
     * @param {string} tag - unique name of the visualization
     * @param {function(Box):Visualization} supplier - function to supply a new instance of the visualization
     */
    register(tag, supplier) {
        // check for duplicates
        if (this.getVisualizationType(tag))
            console.error('registry.js - A visualization with tag \'' + tag + '\' has already been registered!');
        // add the visualization
        this.map.set(tag, new VisualizationType(tag, supplier));
    }

    /**
     * @param {string} tag - unique name of the visualization
     * @returns {null|VisualizationType}
     */
    getVisualizationType(tag) {
        for (const [key, value] of this.map.entries()) {
            if (key === tag)
                return value;
        }
        return null;
    }

    /**
     * @param {string} tag - unique name of the visualization
     * @param {int} [column] - the column to place the visualization
     * @param {int} [row] - the row to place the visualization
     */
    enable(tag, column, row) {
        let type = this.getVisualizationType(tag);
        if (!type)
            console.error('registry.js - Could not find a visualization for tag \'' + tag + '\'!');
        else if (type.enabled)
            console.error('registry.js - Visualization \'' + tag + '\' was already enabled when trying to enable it.');
        else{
            //console.log('registry.js - Enabling \'' + tag + '\'');
            type.enable(column, row);
        }
    }

    /**
     * @param {string} tag - unique name of the visualization
     */
    disable(tag) {
        let type = this.getVisualizationType(tag);
        if (!type)
            console.error('registry.js - Could not find a visualization for tag \'' + tag + '\'!');
        else if (!type.enabled)
            console.error('registry.js - Visualization \'' + tag + '\' was already disabled when trying to disable it.');
        else{
            //console.log('registry.js - Disabling \'' + tag + '\'');
            type.disable();
        }
    }

    /**
     * @param {string} tag - unique name of the visualization
     * @returns {boolean}
     */
    isEnabled(tag) {
        let type = this.getVisualizationType(tag);
        if (!type)
            console.error('registry.js - Could not find a visualization for tag \'' + tag + '\'!');
        return type.enabled;
    }

    /**
     * Enables all visualization types
     */
    enableAll() {
        this.map.forEach(value => {
            $('#'+value.tag).is(':checked') ? value.enable() : null
        })
    }

    /**
     * Disables all visualization types
     */
    disableAll() {
        this.map.forEach(value => value.disable());
    }

    /**
     * @param {string} tag - unique name of the visualization
     * @return {Visualization | null}
     */
    getVisualizationInstance(tag){
        let type = this.getVisualizationType(tag);
        return type === null ? null : type.instance;
    }

    /**
     * @return {Visualization[]} a list of all active visualization instances
     */
    getVisualizationInstances(){
        let visualizations = [];
        this.map.forEach(value => {
            if(value.enabled)
                visualizations.push(value.instance);
        })
        return visualizations;
    }

}

/**
 * Unique instance per type of visualization
 * @property {string} tag - unique name of the visualization
 * @property {function(Box):Visualization} supplier - function to supply a new instance of the visualization
 * @property {boolean} enabled - whether the visualization is enabled
 * @property {Visualization} instance - instance of the visualization
 */
class VisualizationType {

    /**
     * @param {string} tag - unique name of the visualization
     * @param {function(Box):Visualization} supplier - function to supply a new instance of the visualization
     */
    constructor(tag, supplier) {
        this.tag = tag;
        this.supplier = supplier;

        this.enabled = false;
        this.instance = null;
    }

    /**
     * Creates a new instance of the visualization
     * @param {int} column
     * @param {int} row
     */
    enable(column = boxManager.columns >= 1 && boxManager.boxes[0].length >= 2 ? 1 : 0, row = 0) {
        let box = boxManager.createBox(column, row);
        this.instance = this.supplier(box);
        this.enabled = true;
    }

    /**
     * Removes the visualization instance
     */
    disable() {
        this.instance.onRemoved();
        boxManager.removeBox(this.instance.box);
        for(let event of properties.onchange.values())
            event.delete(this.tag);
        this.instance = null;
        this.enabled = false;
    }
}