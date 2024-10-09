(function () {
    'use strict';

    var network = new Lampa.Reguest();
    var api_url = Lampa.Utils.protocol() + Lampa.Manifest.cub_domain + '/api/trailers/get/';

    function get(url, page, resolve, reject) {
      var account = Lampa.Storage.get('account', '{}');

      if (account.token) {
        network.silent(api_url + url + '/' + page, resolve, reject, false, {
          headers: {
            token: account.token
          }
        });
      } else {
        reject();
      }
    }

    function main(oncomplite, onerror) {
      var status = new Lampa.Status(5);

      status.onComplite = function () {
        var fulldata = [];
        if (status.data.rating && status.data.rating.results.length) fulldata.push(status.data.rating);
        if (status.data.anticipated && status.data.anticipated.results.length) fulldata.push(status.data.anticipated);
        if (status.data.popular && status.data.popular.results.length) fulldata.push(status.data.popular);
        if (status.data.added && status.data.added.results.length) fulldata.push(status.data.added);
        if (status.data.trending && status.data.trending.results.length) fulldata.push(status.data.trending);
        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, url, json) {
        json.title = title;
        json.type = name;
        json.url = url;
        status.append(name, json);
      };

      get('trailers/trending', 1, function (json) {
        append(Lampa.Lang.translate('trailers_tranding'), 'trending', 'trailers/trending', json);
      }, status.error.bind(status));
      get('trailers/anticipated', 1, function (json) {
        append(Lampa.Lang.translate('trailers_anticipated'), 'anticipated', 'trailers/anticipated', json);
      }, status.error.bind(status));
      get('trailers/popular', 1, function (json) {
        append(Lampa.Lang.translate('trailers_popular'), 'popular', 'trailers/popular', json);
      }, status.error.bind(status));
      get('trailers/added', 1, function (json) {
        append(Lampa.Lang.translate('trailers_added'), 'added', 'trailers/added', json);
      }, status.error.bind(status));
      get('youtube/rating', 1, function (json) {
        append('YouTube', 'rating', 'youtube/rating', json);
      }, status.error.bind(status));
    }

    function full(params, oncomplite, onerror) {
      get(params.url, params.page, oncomplite, onerror);
    }

    function videos(card, oncomplite, onerror) {
      var url = Lampa.TMDB.api((card.name ? 'tv' : 'movie') + '/' + card.id + '/videos' + '?language=en,ru,uk,zh&api_key=' + Lampa.TMDB.key());
      network.silent(url, oncomplite, onerror);
    }

    function clear() {
      network.clear();
    }

    var Api = {
      get: get,
      main: main,
      full: full,
      videos: videos,
      clear: clear
    };

    function Trailer(data, params) {
      this.build = function () {
        this.card = Lampa.Template.get('trailer', data);
        this.img = this.card.find('img')[0];
        this.is_youtube = params.type == 'rating';

        if (!this.is_youtube) {
          var create = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4);
          this.card.find('.card__title').text(data.title || data.name);
          this.card.find('.card__details').text(create + ' - ' + (data.original_title || data.original_name));
        } else {
          this.card.find('.card__title').text(data.name);
          this.card.find('.card__details').remove();
        }
      };

      this.cardImgBackground = function (card_data) {
        if (Lampa.Storage.field('background')) {
          if (Lampa.Storage.get('background_type', 'complex') == 'poster' && window.innerWidth > 790) {
            return card_data.backdrop_path ? Lampa.Api.img(card_data.backdrop_path, 'original') : this.is_youtube ? 'https://img.youtube.com/vi/' + data.id + '/hqdefault.jpg' : '';
          }

          return card_data.backdrop_path ? Lampa.Api.img(card_data.backdrop_path, 'w500') : this.is_youtube ? 'https://img.youtube.com/vi/' + data.id + '/hqdefault.jpg' : '';
        }

        return '';
      };

      this.image = function () {
        var _this = this;

        this.img.onload = function () {
          _this.card.addClass('card--loaded');
        };

        this.img.onerror = function () {
          _this.img.src = './img/img_broken.svg';
        };
      };

      this.play = function (id) {
        if (Lampa.Manifest.app_digital >= 183) {
          var item = {
            title: Lampa.Utils.shortText(data.title || data.name, 50),
            id: id,
            youtube: true,
            url: 'https://www.youtube.com/watch?v=' + id,
            icon: '<img class="size-youtube" src="https://img.youtube.com/vi/' + id + '/default.jpg" />',
            template: 'selectbox_icon'
          };
          Lampa.Player.play(item);
          Lampa.Player.playlist([item]);
        } else {
          Lampa.YouTube.play(id);
        }
      };

      this.create = function () {
        var _this2 = this;

        this.build();
        this.card.on('hover:focus', function (e, is_mouse) {
          Lampa.Background.change(_this2.cardImgBackground(data));

          _this2.onFocus(e.target, data, is_mouse);
        }).on('hover:enter', function (e) {
          if (_this2.is_youtube) {
            _this2.play(data.id);
          } else {
            Api.videos(data, function (videos) {
              var video = videos.results.find(function (v) {
                return v.iso_639_1 == Lampa.Storage.get('language', 'ru');
              });
              if (!video) video = videos.results.find(function (v) {
                return v.iso_639_1 == 'ru';
              });
              if (!video) video = videos.results.find(function (v) {
                return v.iso_639_1 == 'en';
              });
              if (!video) video = videos.results[0];

              if (video) {
                _this2.play(video.key);
              } else {
                Lampa.Noty.show(Lampa.Lang.translate('trailers_no_trailers'));
              }
            }, function () {
              Lampa.Noty.show(Lampa.Lang.translate('trailers_no_trailers'));
            });
          }
        }).on('hover:long', function (e) {
          if (!_this2.is_youtube) {
            var items = [{
              title: Lampa.Lang.translate('trailers_view'),
              view: true
            }];
            Lampa.Loading.start(function () {
              Api.clear();
              Lampa.Loading.stop();
            });
            Api.videos(data, function (videos) {
              Lampa.Loading.stop();

              if (videos.results.length) {
                items.push({
                  title: Lampa.Lang.translate('title_trailers'),
                  separator: true
                });
                videos.results.forEach(function (video) {
                  items.push({
                    title: video.name,
                    id: video.key
                  });
                });
              }

              Lampa.Select.show({
                title: Lampa.Lang.translate('title_action'),
                items: items,
                onSelect: function onSelect(item) {
                  Lampa.Controller.toggle('content');

                  if (item.view) {
                    Lampa.Activity.push({
                      url: '',
                      component: 'full',
                      id: data.id,
                      method: data.name ? 'tv' : 'movie',
                      card: data,
                      source: 'tmdb'
                    });
                  } else {
                    _this2.play(item.id);
                  }
                },
                onBack: function onBack() {
                  Lampa.Controller.toggle('content');
                }
              });
            });
          } else if (Lampa.Search) {
            Lampa.Select.show({
              title: Lampa.Lang.translate('title_action'),
              items: [{
                title: Lampa.Lang.translate('search')
              }],
              onSelect: function onSelect(item) {
                Lampa.Controller.toggle('content');
                Lampa.Search.open({
                  input: data.title || data.name
                });
              },
              onBack: function onBack() {
                Lampa.Controller.toggle('content');
              }
            });
          }
        });
        this.image();
      };

      this.destroy = function () {
        this.img.onerror = function () {};

        this.img.onload = function () {};

        this.img.src = '';
        this.card.remove();
        this.card = null;
        this.img = null;
      };

      this.visible = function () {
        if (this.visibled) return;
        if (params.type == 'rating') this.img.src = 'https://img.youtube.com/vi/' + data.id + '/hqdefault.jpg';else if (data.backdrop_path) this.img.src = Lampa.Api.img(data.backdrop_path, 'w500');else if (data.poster_path) this.img.src = Lampa.Api.img(data.poster_path);else this.img.src = './img/img_broken.svg';
        this.visibled = true;
      };

      this.render = function () {
        return this.card;
      };
    }

    function Line(data) {
      var content = Lampa.Template.get('items_line', {
        title: data.title
      });
      var body = content.find('.items-line__body');
      var scroll = new Lampa.Scroll({
        horizontal: true,
        step: 600
      });
      var light = Lampa.Storage.field('light_version') && window.innerWidth >= 767;
      var items = [];
      var active = 0;
      var more;
      var last;

      this.create = function () {
        scroll.render().find('.scroll__body').addClass('items-cards');
        content.find('.items-line__title').text(data.title);
        this.bind();
        body.append(scroll.render());
      };

      this.bind = function () {
        data.results.slice(0, light ? 6 : data.results.length).forEach(this.append.bind(this));
        this.more();
        Lampa.Layer.update();
      };

      this.cardImgBackground = function (card_data) {
        if (Lampa.Storage.field('background')) {
          if (Lampa.Storage.get('background_type', 'complex') == 'poster' && window.innerWidth > 790) {
            return card_data.backdrop_path ? Lampa.Api.img(card_data.backdrop_path, 'original') : '';
          }

          return card_data.backdrop_path ? Lampa.Api.img(card_data.backdrop_path, 'w500') : '';
        }

        return '';
      };

      this.append = function (element) {
        var _this = this;

        var card = new Trailer(element, {
          type: data.type
        });
        card.create();
        card.visible();

        card.onFocus = function (target, card_data, is_mouse) {
          last = target;
          active = items.indexOf(card);
          if (!is_mouse) scroll.update(items[active].render(), true);
          if (_this.onFocus) _this.onFocus(card_data);
        };

        scroll.append(card.render());
        items.push(card);
      };

      this.more = function () {
        more = Lampa.Template.get('more');
        more.addClass('more--trailers');
        more.on('hover:enter', function () {
          Lampa.Activity.push({
            url: data.url,
            component: 'trailers_full',
            type: data.type,
            page: light ? 1 : 2
          });
        });
        more.on('hover:focus', function (e) {
          last = e.target;
          scroll.update(more, true);
        });
        scroll.append(more);
      };

      this.toggle = function () {
        var _this2 = this;

        Lampa.Controller.add('items_line', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(items.length ? last : false, scroll.render());
          },
          right: function right() {
            Navigator.move('right');
            Lampa.Controller.enable('items_line');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else if (_this2.onLeft) _this2.onLeft();else Lampa.Controller.toggle('menu');
          },
          down: this.onDown,
          up: this.onUp,
          gone: function gone() {},
          back: this.onBack
        });
        Lampa.Controller.toggle('items_line');
      };

      this.render = function () {
        return content;
      };

      this.destroy = function () {
        Lampa.Arrays.destroy(items);
        scroll.destroy();
        content.remove();
        more.remove();
        items = [];
      };
    }

    function Component$1(object) {
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true,
        scroll_by_item: true
      });
      var items = [];
      var html = $('<div></div>');
      var active = 0;
      var light = Lampa.Storage.field('light_version') && window.innerWidth >= 767;

      this.create = function () {
        Api.main(this.build.bind(this), this.empty.bind(this));
        return this.render();
      };

      this.empty = function () {
        var empty = new Lampa.Empty();
        html.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.build = function (data) {
        var _this = this;

        scroll.minus();
        html.append(scroll.render());
        data.forEach(this.append.bind(this));

        if (light) {
          scroll.onWheel = function (step) {
            if (step > 0) _this.down();else _this.up();
          };
        }

        this.activity.loader(false);
        this.activity.toggle();
      };

      this.append = function (element) {
        if (element.type == 'rating') return;
        var item = new Line(element);
        item.create();
        item.onDown = this.down.bind(this);
        item.onUp = this.up.bind(this);
        item.onBack = this.back.bind(this);

        item.onToggle = function () {
          active = items.indexOf(item);
        };

        item.wrap = $('<div></div>');

        if (light) {
          scroll.append(item.wrap);
        } else {
          scroll.append(item.render());
        }

        items.push(item);
      };

      this.back = function () {
        Lampa.Activity.backward();
      };

      this.detach = function () {
        if (light) {
          items.forEach(function (item) {
            item.render().detach();
          });
          items.slice(active, active + 2).forEach(function (item) {
            item.wrap.append(item.render());
          });
        }
      };

      this.down = function () {
        active++;
        active = Math.min(active, items.length - 1);
        this.detach();
        items[active].toggle();
        scroll.update(items[active].render());
      };

      this.up = function () {
        active--;

        if (active < 0) {
          active = 0;
          this.detach();
          Lampa.Controller.toggle('head');
        } else {
          this.detach();
          items[active].toggle();
        }

        scroll.update(items[active].render());
      };

      this.start = function () {
        var _this2 = this;

        if (Lampa.Activity.active().activity !== this.activity) return;
        Lampa.Controller.add('content', {
          toggle: function toggle() {
            if (items.length) {
              _this2.detach();

              items[active].toggle();
            }
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: this.back
        });
        Lampa.Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        Lampa.Arrays.destroy(items);
        scroll.destroy();
        html.remove();
        items = [];
      };
    }

    function Component(object) {
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true,
        step: 250,
        end_ratio: 2
      });
      var items = [];
      var html = $('<div></div>');
      var body = $('<div class="category-full category-full--trailers"></div>');
      var newlampa = Lampa.Manifest.app_digital >= 166;
      var light = newlampa ? false : Lampa.Storage.field('light_version') && window.innerWidth >= 767;
      var total_pages = 0;
      var last;
      var waitload;

      this.create = function () {
        Api.full(object, this.build.bind(this), this.empty.bind(this));
        return this.render();
      };

      this.empty = function () {
        var empty = new Lampa.Empty();
        scroll.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.next = function () {
        var _this = this;

        if (waitload) return;

        if (object.page < 30 && object.page < total_pages) {
          waitload = true;
          object.page++;
          Api.full(object, function (result) {
            _this.append(result, true);

            waitload = false;
          }, function () {});
        }
      };

      this.cardImgBackground = function (card_data) {
        if (Lampa.Storage.field('background')) {
          if (Lampa.Storage.get('background_type', 'complex') == 'poster' && window.innerWidth > 790) {
            return card_data.backdrop_path ? Lampa.Api.img(card_data.backdrop_path, 'original') : '';
          }

          return card_data.backdrop_path ? Lampa.Api.img(card_data.backdrop_path, 'w500') : '';
        }

        return '';
      };

      this.append = function (data, append) {
        var _this2 = this;

        data.results.forEach(function (element) {
          var card = new Trailer(element, {
            type: object.type
          });
          card.create();
          card.visible();

          card.onFocus = function (target, card_data) {
            last = target;
            scroll.update(card.render(), true);

            if (!light) {
              if (!newlampa && scroll.isEnd()) _this2.next();
            }
          };

          body.append(card.render());
          items.push(card);
          if (append) Lampa.Controller.collectionAppend(card.render());
        });
      };

      this.build = function (data) {
        var _this3 = this;

        if (data.results.length) {
          total_pages = data.total_pages;
          scroll.minus();
          html.append(scroll.render());
          this.append(data);
          if (light && items.length) this.back();
          if (total_pages > data.page && light && items.length) this.more();
          scroll.append(body);

          if (newlampa) {
            scroll.onEnd = this.next.bind(this);

            scroll.onWheel = function (step) {
              if (!Lampa.Controller.own(_this3)) _this3.start();
              if (step > 0) Navigator.move('down');else if (active > 0) Navigator.move('up');
            };
          }

          this.activity.loader(false);
          this.activity.toggle();
        } else {
          html.append(scroll.render());
          this.empty();
        }
      };

      this.more = function () {
        var more = $('<div class="selector" style="width: 100%; height: 5px"></div>');
        more.on('hover:focus', function (e) {
          Lampa.Controller.collectionFocus(last || false, scroll.render());
          var next = Lampa.Arrays.clone(object);
          delete next.activity;
          next.page++;
          Lampa.Activity.push(next);
        });
        body.append(more);
      };

      this.back = function () {
        last = items[0].render()[0];
        var more = $('<div class="selector" style="width: 100%; height: 5px"></div>');
        more.on('hover:focus', function (e) {
          if (object.page > 1) {
            Lampa.Activity.backward();
          } else {
            Lampa.Controller.toggle('head');
          }
        });
        body.prepend(more);
      };

      this.start = function () {
        if (Lampa.Activity.active().activity !== this.activity) return;
        Lampa.Controller.add('content', {
          link: this,
          toggle: function toggle() {
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(last || false, scroll.render());
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            Lampa.Activity.backward();
          }
        });
        Lampa.Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        Lampa.Arrays.destroy(items);
        scroll.destroy();
        html.remove();
        body.remove();
        items = [];
      };
    }

    Lampa.Lang.add({
      trailers_tranding: {
        ru: 'В тренде',
        uk: 'У тренді',
        en: 'In trend',
        zh: '在流行'
      },
      trailers_anticipated: {
        ru: 'В ожидание',
        uk: 'В очікуванні',
        en: 'In expectation',
        zh: '期待中'
      },
      trailers_popular: {
        ru: 'Популярные',
        uk: 'Популярні',
        en: 'Popular',
        zh: '受欢迎的'
      },
      trailers_added: {
        ru: 'Новые',
        uk: 'Нові',
        en: 'New',
        zh: '新的'
      },
      trailers_no_trailers: {
        ru: 'Нет трейлеров',
        uk: 'Немає трейлерів',
        en: 'No trailers',
        zh: '没有拖车'
      },
      trailers_view: {
        ru: 'Подробнее',
        uk: 'Докладніше',
        en: 'More',
        zh: '更多的'
      }
    });

    function startPlugin() {
      window.plugin_trailers_ready = true;
      Lampa.Component.add('trailers_main', Component$1);
      Lampa.Component.add('trailers_full', Component);
      Lampa.Template.add('trailer', "\n        <div class=\"card selector card--trailer layer--render layer--visible\">\n            <div class=\"card__view\">\n                <img src=\"./img/img_load.svg\" class=\"card__img\">\n\n                <div class=\"card__promo\">\n                    <div class=\"card__promo-text\">\n                        <div class=\"card__title\"></div>\n                    </div>\n                    <div class=\"card__details\"></div>\n                </div>\n            </div>\n            <div class=\"card__play\">\n                <img src=\"./img/icons/player/play.svg\">\n            </div>\n        </div>\n    ");
      Lampa.Template.add('trailer_style', "\n        <style>\n        .card.card--trailer,\n        .card-more.more--trailers {\n            width: 25.7em;\n        }\n\n        .card.card--trailer .card__view {\n            padding-bottom: 56%;\n            margin-bottom: 0;\n        }\n\n        .card.card--trailer .card__details{\n            margin-top: 0.8em;\n        }\n        .card.card--trailer .card__play{\n            position: absolute;\n            top: 1.4em;\n            left: 1.5em;\n            background: #000000b8;\n            width: 2.2em;\n            height: 2.2em;\n            border-radius: 100%;\n            text-align: center;\n            padding-top: 0.6em;\n        }\n        .card.card--trailer .card__play img{\n            width: 0.9em;\n            height: 1em;\n        }\n\n        .card-more.more--trailers .card-more__box{\n            padding-bottom: 56%;\n        }\n\n        .category-full--trailers .card{\n            margin-bottom: 1.5em;\n        }\n        .category-full--trailers .card{\n            width: 33.3%;\n        }\n        \n\n        @media screen and (max-width: 767px) {\n            .category-full--trailers .card{\n                width: 50%;\n            }\n        }\n        @media screen and (max-width: 400px) {\n            .category-full--trailers .card{\n                width: 100%;\n            }\n        }\n        </style>\n    ");

      function add() {
        var button = $("<li class=\"menu__item selector\">\n            <div class=\"menu__ico\">\n                <svg height=\"70\" viewBox=\"0 0 80 70\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M71.2555 2.08955C74.6975 3.2397 77.4083 6.62804 78.3283 10.9306C80 18.7291 80 35 80 35C80 35 80 51.2709 78.3283 59.0694C77.4083 63.372 74.6975 66.7603 71.2555 67.9104C65.0167 70 40 70 40 70C40 70 14.9833 70 8.74453 67.9104C5.3025 66.7603 2.59172 63.372 1.67172 59.0694C0 51.2709 0 35 0 35C0 35 0 18.7291 1.67172 10.9306C2.59172 6.62804 5.3025 3.2395 8.74453 2.08955C14.9833 0 40 0 40 0C40 0 65.0167 0 71.2555 2.08955ZM55.5909 35.0004L29.9773 49.5714V20.4286L55.5909 35.0004Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"menu__text\">".concat(Lampa.Lang.translate('title_trailers'), "</div>\n        </li>"));
        button.on('hover:enter', function () {
          Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_trailers'),
            component: 'trailers_main',
            page: 1
          });
        });
        $('.menu .menu__list').eq(0).append(button);
        $('body').append(Lampa.Template.get('trailer_style', {}, true));
      }

      if (window.appready) add();else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }

    if (!window.plugin_trailers_ready) startPlugin();

})();
