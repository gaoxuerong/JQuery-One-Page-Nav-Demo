/*
 * jQuery One Page Nav Plugin
 * http://github.com/davist11/jQuery-One-Page-Nav
 *
 * Copyright (c) 2010 Trevor Davis (http://trevordavis.net)
 * Dual licensed under the MIT and GPL licenses.
 * Uses the same license as jQuery, see:
 * http://jquery.org/license
 *
 * @version 3.0.0
 *
 * Example usage:
 * $('#nav').onePageNav({
 *   currentClass: 'current',
 *   changeHash: false,
 *   scrollSpeed: 750
 * });
 */

;(function($, window, document, undefined){
//分号作用：为了防止代码在压缩或者在执行的时候发生编译错误
	// our plugin constructor
	var OnePageNav = function(elem, options){
		this.elem = elem;//元素
		this.$elem = $(elem);
		this.options = options;//参数
		this.metadata = this.$elem.data('plugin-options');//h5的data的用法
		this.$win = $(window);
		this.sections = {};//空对象
		this.didScroll = false;
		this.$doc = $(document);//文档
		this.docHeight = this.$doc.height();//文档高度
	};

	// the plugin prototype
	OnePageNav.prototype = {
		defaults: {
			navItems: 'a',//<a>标签
			currentClass: 'current',//class 的名称
			changeHash: false,//hash是否改变
			easing: 'swing',//动画类型；可以查询下css的动画类型
			filter: '',//过滤
			scrollSpeed: 750,//速度
			scrollThreshold: 0.5,//Percentage of screen at which the next section should become current
			begin: false,//Function to call when the scrolling starts.
			end: false,// Function to call when the scrolling ends.
			scrollChange: true//Function to call when you enter a section. The current nav item gets passed in.
		},

		init: function() {
			// Introduce defaults that can be extended either
			// globally or using an object literal.
			this.config = $.extend({}, this.defaults, this.options, this.metadata);
		//这里将this.defaults, this.options, this.metadata...进行合并，然后将合并结果返回给this.config了；
		// 详见：http://www.cnblogs.com/zikai/p/5074686.html
			this.$nav = this.$elem.find(this.config.navItems);
			/*找到带有<a></a>标签的对象的集合*/
			//Filter any links out of the nav
			if(this.config.filter !== '') {
				this.$nav = this.$nav.filter(this.config.filter);//过滤;例如filter: ':not(.external)',就是过滤掉class=external
			}

			//Handle clicks on the nav
			this.$nav.on('click.onePageNav', $.proxy(this.handleClick, this));
			/*为this.$nav绑定click事件，仅限在onePageNav的命名空间下，详见：jq.on()的用法；点击之后，就执行handleClick这个函数*/
			//Get the section positions
			this.getPositions();
			/*获取位置坐标信息*/
			//Handle scroll changes
			this.bindInterval();//绑定Interval

			//Update the positions on resize too
			this.$win.on('resize.onePageNav', $.proxy(this.getPositions, this)); /*调整窗口大小后，执行getPositions*/
			return this;//返回this[对象]
		},

		adjustNav: function(self, $parent) {
			self.$elem.find('.' + self.config.currentClass).removeClass(self.config.currentClass);
			$parent.addClass(self.config.currentClass);
			//去除currentClass，然后再添加
		},

		bindInterval: function() {
			var self = this;
			var docHeight;

			self.$win.on('scroll.onePageNav', function() {
				self.didScroll = true;
			});

			self.t = setInterval(function() {
				docHeight = self.$doc.height();

				//If it was scrolled
				if(self.didScroll) {
					self.didScroll = false;
					self.scrollChange();
				}

				//If the document height changes
				if(docHeight !== self.docHeight) {
					self.docHeight = docHeight;
					self.getPositions();
				}
			}, 250);
		},

		getHash: function($link) {
			return $link.attr('href').split('#')[1];
		},//获取href的#后的内容

		getPositions: function() {
			var self = this;
			var linkHref;
			var topPos;
			var $target;

			self.$nav.each(function() {
				linkHref = self.getHash($(this));//例如:linkHref=section-2；
				 $target = $('#' + linkHref);  // $target=$('#section-2')
                //
				if($target.length) {
					topPos = $target.offset().top;//例如:topPos=70
					self.sections[linkHref] = Math.round(topPos);
				}
			});
		},//这段代码好理解；就是为了得到点击内容在屏幕上的位置，

		getSection: function(windowPos) {
			var returnValue = null;
			var windowHeight = Math.round(this.$win.height() * this.config.scrollThreshold);

			for(var section in this.sections) {
				if((this.sections[section] - windowHeight) < windowPos) {
					returnValue = section;
				}
			}

			return returnValue;
		},

		handleClick: function(e) {
			var self = this;
			var $link = $(e.currentTarget);
			//currentTarget是事件的监听者
			var $parent = $link.parent();
			var newLoc = '#' + self.getHash($link);

			if(!$parent.hasClass(self.config.currentClass)) {
				//Start callback
				if(self.config.begin) {
					self.config.begin();
				}

				//Change the highlighted nav item
				self.adjustNav(self, $parent);

				//Removing the auto-adjust on scroll
				self.unbindInterval();

				//Scroll to the correct position
				self.scrollTo(newLoc, function() {
					//Do we need to change the hash?
					if(self.config.changeHash) {
						window.location.hash = newLoc;
					}

					//Add the auto-adjust on scroll back in
					self.bindInterval();

					//End callback
					if(self.config.end) {
						self.config.end();
					}
				});
			}

			e.preventDefault();
		},

		scrollChange: function() {
			var windowTop = this.$win.scrollTop();//设置滚动条距离顶部的位置；
			var position = this.getSection(windowTop);
			var $parent;

			//If the position is set
			if(position !== null) {
				$parent = this.$elem.find('a[href$="#' + position + '"]').parent();

				//If it's not already the current section
				if(!$parent.hasClass(this.config.currentClass)) {
					//Change the highlighted nav item
					this.adjustNav(this, $parent);

					//If there is a scrollChange callback
					if(this.config.scrollChange) {
						this.config.scrollChange($parent);
					}
				}
			}
		},

		scrollTo: function(target, callback) {
			var offset = $(target).offset().top;//offset是距离屏幕顶部的高度，

			$('html, body').animate({
				scrollTop: offset
			}, this.config.scrollSpeed, this.config.easing, callback);
		},//执行动画animate,高度为offset，速度scrollSpeed，动画形式easing，接着执行回调函数callback

		unbindInterval: function() {
			clearInterval(this.t);
			this.$win.unbind('scroll.onePageNav');
		}
        /*解除绑定*/
	};

	OnePageNav.defaults = OnePageNav.prototype.defaults;
/*OnePageNav.prototype的defaults赋给OnePageNav*/
	$.fn.onePageNav = function(options) {
		return this.each(function() {
        new OnePageNav(this, options).init();
    });
		/*$.fn是在Jquery原型上扩展，为了是插件外边的可以访问到onePageNav；例如：$('#nav').onePageNav();
		为了$('#nav')能使用onePageNav()；另外each是遍历，如果有好多'#nav'，这样每个'#nav'都可以用； new OnePageNav(this, options).init();
		插件整体看起来是个匿名函数立即执行；优点就不说了，百度有好多讲解；*/
};

})(jQuery, window , document );