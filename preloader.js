function preLoader(urls, _options){
    this.completed = [];
    this.errors = [];
    this.complete = false;
    this.options = {
        pipeline: false,
        auto: true,
        prefetch: false,
        onError: function(){},
        onProgress: function(){},
        onComplete: function(){}
    };
    this.setOptions = options => Object.keys(options).forEach(key=>{ if (this.options.hasOwnProperty(key)) this.options[key] = options[key];});
    this._load = (src, index) => this._addEvents(new Image(), src, index);
    this._loadNext = index =>{if (!!this.queue[index++]) this._load(this.queue[index], index);};
    this.processQueue = () => {
        this.completed = [];
        this.errors = [];
        if (!this.options.pipeline) for (let i = 0; i < this.queue.length; ++i) this._load(this.queue[i], i); else this._load(this.queue[0], 0);
        return this;
    };
    this._checkProgress = (src, image) => {
        console.log('checkprogress(%o, %o)', src, image);
        if (typeof this.options.onProgress === 'function' && !!src) this.options.onProgress(src, image, this.completed.length);
        if (this.completed.length + this.errors.length === this.queue.length){
            this.complete = true;
            this.options.onComplete(this.completed, this.errors);
        }
    };
    this._cleanup = img => [['error', img.abortHandler, false],['abort', img.abortHandler, false],['load', img.loadHandler, false]].forEach(arr=>img.removeEventListener(arr[0], arr[1], arr[2]));
    this.getAbortHandler = (src, index) => event => {
        console.error('%O abortHandler(%o, %o), image = %O', this, src, index, event.target);
        this._cleanup(event.target);
        this.errors.push(src);
        if (this.options.hasOwnProperty('onError') && typeof this.options.onError === 'function') this.options.onError(src);
        this._checkProgress(src);
        if (this.options.pipeline) self._loadNext(index);
    };
    this.getLoadHandler = (src, index) => event=>{
        console.log('%O loadHandler(%o, %o), image = %O', this, src, index, event.target);
        this._cleanup(event.target);
        this.completed.push(src);
        this._checkProgress(src, event.target);
        if (this.options.pipeline) self._loadNext(index);
    };
    this._addEvents = (image, src, index)=>{
        image.abortHandler = this.getAbortHandler(src, index);
        image.loadHandler = this.getLoadHandler(src, index);
        [['error', image.abortHandler, false],['abort', image.abortHandler, false],['load', image.loadHandler, false]].forEach(arr=>image.addEventListener(arr[0], arr[1], arr[2]));
        image.src = src;
    };
    if (typeof _options === 'object') this.setOptions(_options);
    this.queue = urls;
    if (this.queue.length && this.options.auto) return this.processQueue(); else return this;
}
