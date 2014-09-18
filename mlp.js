(function() {
	var count = 0;
	Mlp = function (option) {
		console.log("MyLittlePlayer init", count);
		this.option = option || false;
		this.players = [];
		this.player = null;
		this.elems = null;
		this.isOnline = option.isOnline || false;
		this.loadCss = (option.loadCss == true) ? true : false;
		this.preload = option.preload || "none"
		this.loadCount = 0;
		this.isReady = false;
	}
	//Select elements by CSS selectors
	Mlp.prototype.Select = function(selector, parrent) {
		var selector = selector || "audio";
		var parrent = parrent || document;
		if(selector[0] == ".") {
			var element = parrent.getElementsByClassName(selector.slice(1));
		} else if( selector[0] == "#") {
			var element = parrent.getElementById(selector.slice(1));
		} else {
			var element = parrent.getElementsByTagName(selector);
		}


		return element;
	}

	Mlp.prototype.Create = function(elems) {
		var elems = elems || "audio";

		if(typeof elems == "string") {
			elems = this.Select(elems);
		}

		if(elems.length == undefined) {
			this.createHelper(elems);
			return true;
		}

		var total = elems.length; //Hack for chrome

		for(i=0; i<total; i++) {
			if(typeof elems[i] != "object")
				continue;

			var tmp = new Mlp(this.option);
			tmp.Create(elems[i], i);
			this.players.push(tmp);
				
		}
	}

	Mlp.prototype.createHelper = function(elem) {
		if(elem == false || elem.length != undefined)
			return false
		elem.preload = this.preload;
		var tmp = document.createElement('div');
		tmp.setAttribute("class", "mlp-player");
		tmp.setAttribute("id", "mlp-"+(++count).toString());
		tmp.appendChild(elem.cloneNode(true));
		tmp.innerHTML += this.markup;
		elem.outerHTML = tmp.outerHTML;

		elem = document.getElementById("mlp-"+count.toString());
		elem.self = this;
		//need to remove this shit or meybe not
		var control = elem.getElementsByClassName("control")[0],
			play = control.getElementsByClassName("play")[0],
			stop = control.getElementsByClassName("stop")[0],
			
			progress = elem.getElementsByClassName("progress")[0],
			loaded = elem.getElementsByClassName("loaded")[0],

			volume_ctrl = elem.getElementsByClassName("volume-ctrl")[0],
			ico_muted = volume_ctrl.getElementsByClassName("muted")[0],
			ico_unmuted = volume_ctrl.getElementsByClassName("unmuted")[0],

			vol_scrub = volume_ctrl.getElementsByClassName("scrubber")[0],
			vol_scroller = vol_scrub.getElementsByClassName("scroller")[0],
			vol_fulbar = vol_scrub.getElementsByClassName("full_bar")[0],

			message = elem.getElementsByClassName("message")[0],
			time = elem.getElementsByClassName("time")[0];

		this.player = elem.getElementsByTagName("audio")[0];
		this.player.volume = (this.option.volume !== undefined) ? this.option.volume : 1;

		this.elems = {
			"control": [play, stop], //control, maybe need it 
			"progress": progress,
			"loaded": loaded,
			"time": time,
			"volume_ctrl": volume_ctrl,
			"vol_ico": [ico_unmuted, ico_muted],
			"vol_scrub": [vol_scrub, vol_scroller, vol_fulbar],
			"message": message,
		}
		if(this.loadCss)
			this.LoadCss();
		this.AddEvents();
	}

	Mlp.prototype.AddEvents = function() {
		//Play & Pause logic
		this.elems.control[0].addEventListener("click", this.PlayPause);
		this.elems.control[1].addEventListener("click", this.PlayPause);

		//Muted & unmuted logic
		this.elems.vol_ico[0].addEventListener("click", this.MuteUnmute);
		this.elems.vol_ico[1].addEventListener("click", this.MuteUnmute);

		//Volume logic
		this.elems.vol_scrub[1].addEventListener("mousedown", this.ScrubberEvents)
		this.elems.vol_scrub[1].addEventListener("mouseup", this.ScrubberEvents)
		this.elems.vol_scrub[0].addEventListener("click", this.ScrubberClick)
	}
	
	Mlp.prototype.LoadCss = function(obj) {
		var obj = obj || this.elems
		for(k in obj) {
			var el = obj[k];
			if(el.length != undefined) {
				this.LoadCss(el);
				continue;
			}
			var bg = getStyle(el, "backgroundImage") || false;
			if(!bg)
				continue;

			bg = bg.slice(bg.indexOf("http"), bg.indexOf('")'))
			if(bg.length > 5) {
				var img = new Image();
				img.src = bg;
				img.need = el;
				img.root = this;

				this.loadCount++;

				img.onload = function(e) {
					var t = e.target;
					t.need.style.width = t.width;
					t.need.style.height = t.height;
					if(--t.root.loadCount == 0)
						t.root.ready();
				}
			}
		}
	}

	Mlp.prototype.ready = function() {
		this.isReady = true;
		this.render();
	}

	Mlp.prototype.PlayPause = function(e) {
		//If click class is play - start playing
		var root = Root(e.target).self;
		var isPlay = (e.target.className == "play") ? false : true;
		if(root.isOnline) {
			var src = root.player.src;
			var date = new Date();
			if(src.indexOf("cache") == -1) {
				root.player.src = src+"?cache="+date.getTime();
			} else {
				src = src.slice(0, src.indexOf("?cache"));
				root.player.src = src+"?cache="+date.getTime();
			}
		}

		if(isPlay) {
			hideShow(root.elems.control, true);
			root.player.pause();
		} else {
			hideShow(root.elems.control);
			root.player.play();
		}
	}

	//For more comfortable api
	Mlp.prototype.Play = function() {
		this.elems.player.play();
		hideShow(this.elems.control);
	}

	Mlp.prototype.MuteUnmute = function(e) {
		var root = Root(e.target).self;
		var isMuted = (e.target.className == "muted") ? false : true;
		if(isMuted) {
			root.player.muted = true;
					hideShow(root.elems.vol_ico);
		}
		else {
			root.player.muted = false;
			hideShow(root.elems.vol_ico, true);
		}
	}

	Mlp.prototype.ScrubberEvents = function(e) {
		var root = Root(e.target).self;
		var scrub = root.elems.vol_scrub[1];
		var bg = root.elems.vol_scrub[0];

		//if(e.buttons == 1) {
			root.elems.volume_ctrl.addEventListener("mousemove", root.ScrubberMove, false);
			root.elems.volume_ctrl.addEventListener("mouseup", root.ScrubberMove, false);
			root.elems.volume_ctrl.addEventListener("mouseleave", root.ScrubberMove, false);
		//}
		return true;
	};

	Mlp.prototype.ScrubberMove = function(e) {
		var root = Root(this).self;
		var scrub = root.elems.vol_scrub[1];
		var bg = root.elems.vol_scrub[0];
		var bg_pos = bg.getBoundingClientRect();
		//Holly shit
		if(e.type == "mouseup" || e.type == "mouseleave") {
			root.elems.volume_ctrl.removeEventListener("mousemove", root.ScrubberMove, false);
			root.elems.volume_ctrl.removeEventListener("mouseup", root.ScrubberMove, false);
			root.elems.volume_ctrl.removeEventListener("mouseleave", root.ScrubberMove, false);
		} else {
			var move = scrub.getBoundingClientRect().left - e.clientX;
			var left = (scrub.style.left != "") ? scrub.style.left : getStyle(scrub, "left");
			left = parseInt(left);
			var point = left - move;

			if(point > (bg_pos.width - scrub.offsetWidth/2) || point <= 0) {
				root.elems.volume_ctrl.removeEventListener("mousemove", root.ScrubberMove, false);
				root.elems.volume_ctrl.removeEventListener("mouseup", root.ScrubberMove, false);
			}

			if(point > bg_pos.width - scrub.offsetWidth/2) {
				point = (bg_pos.width - scrub.offsetWidth/2)-4;
			}

			var volume = (bg_pos.width * point/50)/100;
			if(volume > 1)
				volume = 1;
			if(volume < 0)
				volume = 0;
			// root.elems.vol_scrub[2].style.width = volume + "%";
			root.player.volume = volume;
		}
		root.render();

		return true;
	}

	Mlp.prototype.ScrubberClick = function(e) {
		var root = Root(this).self;

		if(e.target == root.elems.vol_scrub[1])
			return true;

		//Hack for old browser
		e.layerX = e.layerX || e.offsetX;

		var volume = (this.offsetWidth/50 * e.layerX)/100;
		if(volume > 1)
			volume = 1;
		if(volume < 0)
			volume = 0;
		root.player.volume = volume;
		root.render(); 

		return true;
	}

	Mlp.prototype.render = function() {
		var bg_pos = this.elems.vol_scrub[0].getBoundingClientRect();
		var position = (((this.player.volume * 100) * 50) / bg_pos.width);

		this.elems.vol_scrub[2].style.width = (this.player.volume * 100) + "%";	
		this.elems.vol_scrub[1].style.left = position;
	}


	Mlp.prototype.markup = '\
		<div class="control">\
			<div class="play"></div>\
			<div class="stop"></div>\
		</div>\
		<div class="body">\
			<div class="progress"></div>\
			<div class="loaded"></div>\
			<div class="time"></div>\
		</div>\
		<div class="volume-ctrl">\
			<div class="icon">\
				<div class="muted"></div>\
				<div class="unmuted"></div>\
			</div>\
			<div class="scrubber">\
				<div class="full_bar"></div>\
				<div class="scroller"></div>\
			</div>\
		</div>\
		<div class="message"></div>';


	//My function
	function getStyle(elem, option) {
		var option = option || false;
		if(typeof elem != "object")
			return false;
		ret = window.getComputedStyle(elem);
		if(option)
			return ret[option] || false;
		else
			return ret;
	}


	function hideShow(first, secReverse) {
		if(typeof first == "object" && secReverse == undefined) {
			secReverse = first[1];
			first = first[0];
		} else if(typeof first == "object" && secReverse === true) {
			secReverse = first[0];
			first = first[1];
		}

		first.style.display  = "none";
		secReverse.style.display = "block";
	}

	function Root(el) {
		return(el.className != "mlp-player" && el.className != "") ? Root(el.parentElement) : el;
	}

}).call(this);