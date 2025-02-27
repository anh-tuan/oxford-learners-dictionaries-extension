function ContentManager(place_holder) {
    this.place_holder = place_holder;
    this.selection = null;
    this.rect = null;
    this.tooltip = new Tooltip(this);
    this.getSetting();
    this.addListener();
    return this;
}

ContentManager.prototype.getSetting = function () {
    this.max_length = 20;
    this.max_words = 1;
}

ContentManager.prototype.addListener = function () {
    this.place_holder.addEventListener("mouseup", this._onMouseUp.bind(this)); //mouseup
}

// fetch select word
ContentManager.prototype._onMouseUp = function (event) {

    this.selection = window.getSelection();
    if (this.selection.rangeCount <= 0)
        return;

    if (!this.shouldRenderTooltip(event.target))
        return;

    this.rect = (this.isSelectionWithinInput(event)) ?
        event.target.getBoundingClientRect() :
        this.selection.getRangeAt(0).getBoundingClientRect();

    //if(this.altKey === true) {
    this.createTooltip(this.word);
    //}
}

ContentManager.prototype.createTooltip = function (word) {
    this.initTooltip();
    this._fetch(word);
}

ContentManager.prototype.isSelectionWithinInput = function (event) {
    return ["textarea", "input"].includes(event.target.tagName.toLowerCase());
}
// not render if selection is inside tooltip or not a word
ContentManager.prototype.shouldRenderTooltip = function (event) {
    if (this.tooltip.isInside(event)) {
        return false;
    }

    // remove when click outside
    this.tooltip.deleteFromDOM();

    this.word = this.wordProcessing(this.selection.toString());

    return (this.word && this.word != "");
}

// clear symbols, double spaces, check if contains number or not meet the options
ContentManager.prototype.wordProcessing = function (text) {
    // check number
    if (/\d/.test(text))
        return "";

    // remove double spaces
    let result = text.trim().replace(/\s+\s/g, " ");

    // remove symbols
    let e = new RegExp("([=+?!@#$%⁄^&{_}():;\\|<>.,]|[\n])", "g");
    result = (result.replace(e, "")).replace("’", "'");

    return this.checkWordOption(result) ? result.toLowerCase() : "";
}

// check number of word and length of word
ContentManager.prototype.checkWordOption = function (word) {
    const number = word.split(" ").length;
    return (number <= this.max_words && word.length <= this.max_length);
}

// fetch and forward response to this.handleResponse
ContentManager.prototype._fetch = function (word) {
    (new Request(word)).sendRequest()
        .then(res => {
            if (!this.tooltip.html_element)
                this.handleResponse(res);
        })
        .catch(error => {
            // handle 404 or netword error, 
            let errorMsg;
            if (error === 404) {
                errorMsg = Content.notFound(this.word);
            }
            else {
                errorMsg = Content.networdError(this.word);
            }
            this.renderTooltip(errorMsg);
        });
}

//scrape if success
ContentManager.prototype.handleResponse = async function(response) {
    const scrapper = await new DOMScrapper(response);
    await this.renderTooltip(await scrapper.getResponseForTooltip());
}

ContentManager.prototype.renderTooltip = function (data) {
    this.tooltip.renderTooltip(data, this.rect);
}

ContentManager.prototype.initTooltip = function () {
    //this.tooltip.deleteFromDOM();
    // loading word info
}

