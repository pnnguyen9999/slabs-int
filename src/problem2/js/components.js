
Vue.component("modal-backdrop", {
  props: ["isShow", "setShow"],
  template: `
   <transition>
    <div
      v-if="isShow"
      @click="setShow(false)"
      class="absolute z-10 flex justify-center items-center top-0 left-0 bg-[rgba(0,0,0,0.7)] w-screen h-screen p-3"
    >
    <slot></slot>
  </transition>
  </div>
`
});

Vue.component("zone-swap-button", {
  template: `
  <button
    v-bind="$attrs"
    v-on="$listeners"
    class="font-semibold disabled:bg-slate-500 shadow-lg p-2 rounded-md transition ease-in-out bg-[#9B3922] hover:translate-y-3 hover:bg-[#C6472B] duration-200 border-b-8 border-[rgba(0,0,0,0.2)]"
  >
    <slot></slot>
  </button>
  `
});

Vue.component("token-input", {
  props: ["pickerType", "tokens"],
  template: `
  <div v-bind="$attrs">
  <div :class="'shadow-lg border-b-8 transition duration-300 ease-in-out w-full p-4 py-2 rounded-md flex flex-col gap-2 border-[rgba(0,0,0,0.2)] '+inputContainerClass">
    <div class="flex justify-between">
      <span class="text-sm">Balance: {{wallet.currentBalance}}</span>
      <span class="text-sm">{{pickerType === MODAL_TYPE.PAY_TOKEN ? "From" : "To"}}</span>
    </div>
    <div class="flex justify-between items-start gap-3">
      <button @click="showPicker(!isShowPicker)">
        <div
          v-if="currentToken"
          class="flex gap-2 items-center bg-[rgba(0,0,0,0.2)] p-2 rounded-md w-max"
        >
          <img
            :src="'./tokens/' + currentToken + '.svg'"
            class="w-[25px]"
          />
          <span>{{currentToken}}</span>
          <i class="fa-solid fa-chevron-down ic"></i>
        </div>
        <div v-else class="flex gap-1 items-center bg-[rgba(0,0,0,0.2)] p-2 rounded-md w-max">
           <span>select token</span>
           <i class="fa-solid fa-chevron-down ic"></i>
        </div>
      </button>
      <div class="flex flex-col items-end flex-grow">
        <input ref="inputRef" v-model="tokenInput" @input="handleInput" @focus="inputFocus" @blur="inputBlur" placeholder="0" class="bg-transparent text-right text-3xl w-full"/>
        <span class="text-sm">{{tokenFiatPrice}}</span>
      </div>
    </div>
  </div>
  <token-select-modal
   :type="pickerType"
   :is-show="isShowPicker"
   :set-show="showPicker"
   :tokens="tokens"
  ></token-select-modal></div>`,
  data() {
    return {
      isShowPicker: false,
      tokenService: TokenService,
      wallet: CryptoWallet,
      isInputFocused: false,
    };
  },
  methods: {
    showPicker(status) {
      this.isShowPicker = status;
      if (!status) {
        this.$refs.inputRef.focus();
      }
    },
    handleInput(event) {
      let inputValue = event.target.value;
      inputValue = inputValue.replace('e', '');
      inputValue = inputValue.replace(/[^0-9.,]/g, '');
      inputValue = inputValue.replace(/[,\.]/g, '.');
      let decimalIndex = inputValue.indexOf('.');
      if (decimalIndex !== -1) {
        inputValue = inputValue.slice(0, decimalIndex + 1) + inputValue.slice(decimalIndex + 1).replace(/[.,]/g, '');
      }
      this.tokenInput = inputValue;
    },
    inputFocus() {
      this.isInputFocused = true;
    },
    inputBlur() {
      this.isInputFocused = false;
    }
  },
  computed: {
    currentToken() {
      if (this.pickerType === MODAL_TYPE.PAY_TOKEN) {
        return this.tokenService.payToken;
      } else {
        return this.tokenService.receiveToken;
      }
    },
    tokenFiatPrice() {
      const priceToFiat = (this.pickerType === MODAL_TYPE.PAY_TOKEN) ? this.tokenService.payTokenPriceToFiat : this.tokenService.receiveTokenPriceToFiat;
      if (priceToFiat !== 0) {
        return `$${priceToFiat}`;
      } else {
        return "-";
      }
    },
    tokenInput: {
      get() {
        return this.pickerType === MODAL_TYPE.PAY_TOKEN ? this.tokenService.inputTokenValue : this.tokenService.inputReceiveValue;
      },
      set(value) {
        if (this.pickerType === MODAL_TYPE.PAY_TOKEN) {
          this.tokenService.setInputTokenValue(value);
        } else {
          this.tokenService.setinputReceiveValue(value);
        }
      }
    },
    inputContainerClass() {
      return this.isInputFocused ? 'bg-[#481E14] scale-[1.015]' : 'bg-[rgba(255,255,255,0.8)] text-black';
    }
  },
  watch: {
    tokenInput(newVal) {
      if (this.pickerType === MODAL_TYPE.PAY_TOKEN) {
        this.tokenService.setPayTokenPriceToFiat(newVal);
      } else {
        this.tokenService.setReceiveTokenPriceToFiat(newVal);
      }
    }
  }
});


Vue.component("swap-token-modal", {
  props: ["isShow", "setShow"],
  template: `
    <modal-backdrop :is-show="isShow" :setShow="setShow">
    <div @click.stop="" class="overflow-hidden shadow-lg w-[350px]  bg-[#D9E8E2] text-white rounded-md border-b-8 border-[rgba(0,0,0,0.2)]">
      <div class="bg-[#9B3922] p-3 flex flex-col gap-5">
        <div class="flex items-center justify-between">
            <span class="font-semibold">Confirm swap</span>
            <i @click="setShow(false)" class="fa-solid fa-xmark cursor-pointer"></i>
        </div>
        <div class="flex justify-center">
          <div class="relative w-[160px] h-[80px] flex">
            <img
              :src="'./tokens/' + tokenService.payToken + '.svg'"
              class="absolute animate-pulse left-1 w-[80px] shadow-md rounded-full"
            />
            <img
              :src="'./tokens/' + tokenService.receiveToken + '.svg'"
              class="absolute left-[70px] w-[80px] shadow-md border-4 border-[rgba(255,255,255,0.5)] rounded-full"
            />
            </div>
        </div>
        <div class="text-center flex flex-col gap-2">
          <span class="font-semibold text-sm text-[#D9E7E2]">Swapping {{tokenService.inputTokenValue}} {{tokenService.payToken}} for {{tokenService.inputReceiveValue}} {{tokenService.receiveToken}} </span>
          <span class="text-[11px] text-[#DADADA]">Output is estimated to arrive within 5-10 mins or transaction will revert.</span>
        </div>
      </div>
      <div class="text-black p-3 text-sm flex flex-col gap-1">
        <div class="flex justify-between items-center font-semibold">
          <span>Price:</span>
          <span><span>$</span>{{ tokenService.receiveTokenPriceToFiat }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Exchange rate:</span>
          <span>{{formatCurrency(tokenService.exchangeRate)}}</span>
        </div>
        <div class="flex justify-between items-center">
          <span>Price impact:</span>
          <span>{{computedPriceImpact}}%</span>
        </div>
        <zone-swap-button
            class="text-white my-3 flex gap-2 justify-center items-center"
            :disabled="isSwapping"
            @click="handleConfirmSwap"
          >
          <i v-if="isSwapping" class="animate-spin fa-solid fa-yin-yang"></i>
            Confirm swap
        </zone-swap-button>
      </div>
    </div>
    </modal-backdrop>
  `,
  data() {
    return {
      wallet: CryptoWallet,
      tokenService: TokenService,
      isSwapping: false,
    };
  },
  methods: {
    handleConfirmSwap() {
      this.isSwapping = true;
      this.wallet.simulateSwap({
        from: this.tokenService.payToken,
        to: this.tokenService.receiveToken,
        amount: this.tokenService.inputTokenValue,
        message: "Just a simple mock for the Switcheo Labs interview, created by Ryan Nguyen."
      }, (status, result) => {
        if (status === TRANSACTION_STATUS.SUCCESS) {
          console.log(result);
          this.setShow(false);
          this.$toast.show("🎉 Transaction success!");
        } else {
          this.$toast.show("❌ Transaction failed!");
        }
        this.isSwapping = false;
      });
    }
  },
  computed: {
    computedPriceImpact() {
      return Math.abs(formatCurrency((this.tokenService.payTokenPriceToFiat - this.tokenService.receiveTokenPriceToFiat) / this.tokenService.payTokenPriceToFiat * 100));
    }
  }
});

Vue.component("token-select-modal", {
  props: ["type", "isShow", "setShow", "tokens"],
  template: `
   <modal-backdrop :is-show="isShow" :setShow="setShow">
     <div class="overflow-hidden shadow-lg w-[370px] h-[80%] bg-[#D9E8E2] text-black rounded-md border-b-8 border-[rgba(0,0,0,0.2)] flex flex-col">
       <div @click.stop="" class="bg-[#bd4428] text-white p-3 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-semibold">Select a token</span>
          <i @click="setShow(false)" class="fa-solid fa-xmark cursor-pointer"></i>
        </div>
        <input autofocus placeholder="search name" v-model="searchText" @input="handleSearch" class="bg-[rgba(0,0,0,0.5)] p-2 px-3 rounded-md"/>
          <div class="flex flex-wrap gap-[8px] mt-3 mb-1">
            <div v-for="token in filteredTokens" :key="token" @click="handleSetToken(token);setShow(false)" class="transition ease-in-out duration-300 hover:bg-[#cae4da] hover:text-black bg-[#368E6B] rounded-md shadow-md text-sm p-3 py-[5px] border-b-[6px] border-[rgba(0,0,0,0.2)] cursor-pointer">
              <div class="flex gap-1 items-center">
                <img
                  :src="'./tokens/' + token.currency + '.svg'"
                  class="w-[15px]"
                />
                <span>{{token.currency}}</span>
              </div>
            </div>
        </div>
       </div>
       <div class="flex flex-col flex-grow overflow-y-auto">
          <div
            v-for="token in handleSearch()"
            :key="token.currency"
            @click="handleSetToken(token)"
            class="flex gap-2 p-3 items-center w-full cursor-pointer hover:bg-[#368E6B] hover:border-b-8 border-[rgba(0,0,0,0.2)] hover:text-white anm-hover"
          >
            <img
              :src="'./tokens/' + token.currency + '.svg'"
              class="w-[28px]"
            />
            {{token.currency}}
          </div>
       </div>
     </div>
   </modal-backdrop>
  `,
  data() {
    return {
      tokenService: TokenService,
      commonTokens: ["ETH", "BUSD", "USDC", "LUNA", "WBTC", "axlUSDC"],
      searchText: ''
    };
  },
  methods: {
    handleSetToken(token) {
      const action = this.type === MODAL_TYPE.PAY_TOKEN ? 'setPayToken' : 'setReceiveToken';
      this.tokenService[action](token.currency);

      this.tokenService.calculateExchangeRate((rate) => {
        this.tokenService.reCalculateTokenInput(rate);
      });
    },
    handleSearch() {
      return this.tokens.filter(token => token.currency.toLowerCase().includes(this.searchText.toLowerCase()));
    }
  },
  computed: {
    filteredTokens() {
      return this.tokens.filter(token => {
        return this.commonTokens.includes(token.currency);
      });
    }
  }
});

const CustomToast = {
  install(Vue) {
    Vue.prototype.$toast = {
      show(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 10px;
          font-size: 10pt;
          background-color: #D9E8E2;
          color: #000;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.style.opacity = 1;
        }, 100);

        setTimeout(() => {
          toast.style.opacity = 0;
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 5000);
      }
    };
  }
};
