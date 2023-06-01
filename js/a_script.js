/* eslint-disable object-curly-newline */
/* eslint-disable indent */
((w, d) => {
  const apiReady = setInterval(() => {
    if (
      typeof w.$ !== 'function' ||
      typeof w.A7.getNextCnt !== 'function' ||
      typeof w.Cookies !== 'function'
    ) {
      return;
    }
    clearInterval(apiReady);

    const { Cookies, $ } = w;
    const $page = $('.js-page');

    /* --- listing --- */
    const $listRoot = d.querySelector('.js-list-root');
    const $listLoadBtn = d.querySelector('.js-list-btn');
    const LIST_LENGTH = 300;
    const LIST_SHOW_LENGTH = 3;
    const isUserHadGratis = Cookies.get('hadFreeCall');
    const userCurrency =
      (Cookies.get('_aum') &&
        Cookies.get('_aum')
          .match(/umc=\w{3}/g)[0]
          .split('=')[1]
          .toLowerCase()) ||
      'rur';

    const getListingData = async (lengthLimit) => {
      const res = await fetch(
        `https://rest.astro7.ru/advisers/listing?httpReferer=index&limit=${lengthLimit}`
      );
      return res.json();
    };

    const onPicItemsLoad = ({ picItems = [], callBack }) => {
      const promiseSet = picItems
        .filter((item) => !item.complete)
        .map(
          (item) => new Promise((resolve) => {
              const thisPic = item;
              thisPic.onload = resolve;
              thisPic.onerror = resolve;
            })
        );
      Promise.all(promiseSet).then(() => {
        callBack();
      });
    };

    const listDataIndexSet = {
      indexSetLength: null,
      indexSet: [],
      init({ listLength = 3 }) {
        this.indexSetLength = listLength;
        this.indexSet = [...Array(this.indexSetLength)];
        this.indexSet.forEach((_, index, arr) => {
          const thatArr = arr;
          thatArr[index] = index;
        });
      },
      updateIndexSet() {
        this.indexSet.forEach((val, index, arr) => {
          const thatArr = arr;
          thatArr[index] = val + this.indexSetLength;
        });
      }
    };
    listDataIndexSet.init({ listLength: LIST_SHOW_LENGTH });

    class ExpertCard {
      constructor({ data, isGratis, userCurrency }) {
        this.data = data;
        this.currency = userCurrency;
        this.isUserGratis = isGratis;
        this.isExpertGratis = Boolean(data.adviser_free_call);
        this.id = data.adviser_id;
        this.uid = data.adviser_uid;
        this.url = data.adviser_keyword;
        this.title = data.adviser_pseudonym;
        this.status = data.adviser_status.toLowerCase();
        this.statusMeta = {
          online: { status: 'online', name: 'На линии' },
          talking: { status: 'talking', name: 'Сейчас говорит' },
          busy: { status: 'talking', name: 'Сейчас говорит' },
          offline: { status: 'offline', name: 'Нет на линии' }
        };
        this.vote = data.adviser_vote;
        this.votesCount = data.adviser_votes_count
          .split('|')
          .reduce((partSum, a) => partSum + +a, 0);
        this.slogan = data.adviser_slogan.replace(/<br\/>|<br>|<p>|<p\/>/, ' ');
      }

      getMarkup() {
        const getOrderBtnMarkup = () => {
          const isExpertOnline = this.status === 'online';
          const btnClassName = isExpertOnline ? 'g-btn--one' : 'g-btn--three';
          const btnText = isExpertOnline ? 'Позвонить' : 'Забронировать';
          return `
            <a href='/yii2/inline-order/call/app/${this.uid}' class='g-btn ${btnClassName} g-btn--s h-w100 main-expert_panel-item'>
              ${btnText}
            </a>`;
        };

        const getRateValMarkup = () => {
          switch (this.currency) {
            case 'usd':
              return `${this.data.adviser_rate_usd / 100} $/мин`;
            case 'eur':
              return `${this.data.adviser_rate_eur / 100} €/мин`;
            default:
              return `${this.data.adviser_rate / 100} руб/мин`;
          }
        };

        const getPanelMarkup = () => {
          const isUserCanGratis = !this.isUserGratis && this.isExpertGratis;
          return `
            <div class='main-expert_panel-item'>${
              isUserCanGratis
                ? "<span class='price price--two price--six'>Бесплатно</span>"
                : ''
            }
              <span class='price price--two price--five ${
                isUserCanGratis ? 'price--five' : ''
              }'>${getRateValMarkup()}</span>
            </div>
            ${getOrderBtnMarkup()}`;
        };

        return `
          <section class='js-list-item main-expert g-hidden'>
            <div class='main-expert_pic'>
              <a href='/experts/profiles/${this.url}'>
                <picture class='js-list-item-pic'>
                  <source srcset='https://148924.selcdn.ru/astro7_public/adviser/${
                    this.id
                  }/icon_2.webp' type='image/webp'>
                  <img src='https://148924.selcdn.ru/astro7_public/adviser/${
                    this.id
                  }/icon_2.jpg'
                    width='196' height='221' alt='${this.title}'>
                </picture>
              </a>
              <div class='b-rating | main-expert_rating'>
                <div class='b-rating_count'>
                  <svg class='g-star g-star--s g-star--one | b-rating_star' width='24' height='23'>
                    <use xlink:href='/fileadmin/templates/images/sprite/sprite-main.svg#star'></use>
                  </svg>
                  <span class='b-rating_rate'>${this.vote}</span>
                </div>
                <div class='b-rating_amount'>
                  <span>${this.votesCount}</span> оценок
                </div>
              </div>
            </div>
            <div class='main-expert_main'>
              <div class='main-expert_panel'>
                ${getPanelMarkup()}
              </div>
              <div class='main-expert_holder main-expert_holder--one'>
                <a class='link-two h3 main-expert_name' href='/experts/profiles/${
                  this.url
                }'>
                  ${this.title}
                </a>
                <div class='main-expert_meta'>
                <span class="main-expert_status | exp-status exp-status--${
                  this.statusMeta[this.status].status
                }">
                  ${this.statusMeta[this.status].name}
                </span>
                </div>
              </div>
              <p class='main-expert_description main-expert_description--one'>
                ${this.slogan}
                <a class='link-two | b-show-link' href='#' onclick='event.preventDefault();this.parentNode.classList.add("is-opened");this.remove();'>
                  Показать полностью
                  <svg class='b-show-link_ico' width='13' height='9' viewBox='0 0 13 9'>
                    <path d='M11.18,2.979L6.913,7.245l-1.121.013L1.526,2.992,2.916,1.6l3.43,3.43L9.789,1.589Z'></path>
                  </svg>
                </a>
              </p>
            </div>
          </section>`;
      }
    }

    const drawListItems = ({ data, listRoot, indexSet, callBack }) => {
      const drawDelay = 500;
      setTimeout(() => {
        indexSet.forEach((elt) => {
          const thatCard = new ExpertCard({
            data: data[Object.keys(data)[elt]],
            isGratis: isUserHadGratis,
            userCurrency
          });
          listRoot.insertAdjacentHTML('beforeend', thatCard.getMarkup());
        });

        onPicItemsLoad({
          picItems: [
            ...listRoot.querySelectorAll('.js-list-item:not(.is-visible) img')
          ],
          callBack: () => {
            const cbDelay = 500;
            setTimeout(() => {
              listRoot
                .querySelectorAll('.js-list-item:not(.is-visible)')
                .forEach((elt, index) => {
                  setTimeout(() => {
                    elt.classList.add('is-visible');
                  }, 100 * index);
                });
              if (callBack) {
                callBack();
              }
            }, cbDelay);
          }
        });
      }, drawDelay);
    };

    const showMoreExperts = ({ data, callBack }) => {
      listDataIndexSet.updateIndexSet();
      drawListItems({
        data,
        listRoot: $listRoot,
        indexSet: listDataIndexSet.indexSet,
        callBack
      });
    };

    getListingData(LIST_LENGTH)
      .then((data) => {
        // console.log(expListData);
        drawListItems({
          data,
          listRoot: $listRoot,
          indexSet: listDataIndexSet.indexSet,
          callBack: () => {
            $listRoot.classList.remove('root--one');
            d.querySelectorAll('.js-fish').forEach((e) => e.remove());
          }
        });

        $listLoadBtn.addEventListener('click', (e) => {
          const that = e.target;
          that.classList.add('is-loader');
          that.disabled = true;
          showMoreExperts({
            data,
            callBack: () => {
              that.classList.remove('is-loader');
              that.disabled = false;
            }
          });
        });
      })
      .catch((err) => {
        console.log(err);
      });
    /* --- listing — end --- */

    /* --- test --- */
    const test = {
      initCounter() {
        this.counterTotal.text(this.questionLength);
      },
      increaseCounter() {
        this.counterCurrent.text(+this.counterCurrent.text() + 1);
      },
      placeTestForm() {
        setTimeout(() => {
          w.A7.scrollToElt(this.form, 500, 10);
        }, 500);
      },
      handleAnswer({ val }) {
        this.updateResult({
          resultItems: this.answerValueItems,
          val
        });
        console.log(this.answerValueItems);
      },
      getNextQuestion() {
        const $curQuestion = this.form.find('.js-test-question.is-visible');
        const $nextQuestion = $curQuestion.next('.js-test-question');
        const $curQuestionChoosenRadio = $curQuestion.find(
          '.js-test-radio:checked'
        );
        const isCurQuestionComplete = $curQuestionChoosenRadio.length;
        const isNextQuestionExist = $nextQuestion.length;

        if (isCurQuestionComplete) {
          this.handleAnswer({ val: $curQuestionChoosenRadio.attr('value') });
          if (isNextQuestionExist) {
            this.increaseCounter();
            $curQuestion.removeClass('is-visible');
            $nextQuestion
              .addClass('is-visible')
              .find('.js-test-radio')[0]
              .focus();
            if ($(document).outerWidth() <= 736) {
              this.placeTestForm();
            }
          } else {
            this.resultCallback();
          }
        } else {
          w.A7.shakeElt(this.btn);
        }
      },
      getResult() {
        return this.calcResult(this.answerValueItems);
      },
      init({
        elt,
        answerVariantsLength,
        updateResult,
        calcResult,
        resultCallback
      }) {
        this.form = elt;
        this.counterTotal = this.form.find('.js-test-total');
        this.counterCurrent = this.form.find('.js-test-current');
        this.btn = this.form.find('.js-test-btn');
        this.questionLength = this.form.find('.js-test-question').length;
        this.answerValueItems = Array(answerVariantsLength).fill(0);
        this.updateResult = updateResult;
        this.calcResult = calcResult;
        this.resultCallback = resultCallback;
        this.initCounter();
        this.btn.on('click', () => {
          this.getNextQuestion();
        });
      }
    };

    test.init({
      elt: $('.js-test'),
      answerVariantsLength: 3,
      updateResult: ({ resultItems, val }) => {
        const arr = resultItems;
        arr[val - 1] += 1;
      },
      calcResult: (resultItems) => resultItems.indexOf(Math.max(...resultItems)),
      resultCallback: () => {
        console.log(test.getResult());
        $('.js-result-item').eq(test.getResult()).addClass('is-visible');
        $('.js-finish').addClass('is-visible');
        w.A7.getNextCnt();
        w.A7.scrollToElt($page, 0, 0);
        $page.addClass('is-done');
      }
    });
    /* --- test — end --- */
  }, 100);
})(window, document);
