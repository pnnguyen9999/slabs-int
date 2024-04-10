function formatCurrency(value) {
    if (isNaN(value) || !isFinite(value)) {
        return null;
    } else {
        return value === 0 ? 0 : Number(value).toFixed(4);
    }
}
const processAddressString = (address) => {
    return address.substring(0, 8) + "..." + address.substring(38);
};
class TServices {
    constructor() {
        this.payToken = "BLUR";
        this.receiveToken = null;
        this.inputTokenValue = null;
        this.inputReceiveValue = null;
        this.exchangeRate = 0;
        this.tokensData = null;
        this.originalSwapPosition = true;
        this.payTokenPriceToFiat = 0;
        this.receiveTokenPriceToFiat = 0;
    }
    setTokenData(data) {
        this.tokensData = data;
    }
    setPayToken(value) {
        if (this.receiveToken === value) {
            this.swap();
        } else {
            this.payToken = value;
        }
    }
    setReceiveToken(value) {
        if (this.payToken === value) {
            this.swap();
        } else {
            this.receiveToken = value;
        }
    }
    setPayTokenPriceToFiat(value) {
        const token = this.tokensData.find((token) => token.currency === this.payToken);
        this.payTokenPriceToFiat = formatCurrency(value * token.price);
    }
    setReceiveTokenPriceToFiat(value) {
        const token = this.tokensData.find((token) => token.currency === this.receiveToken);
        this.receiveTokenPriceToFiat = formatCurrency(value * token.price);
    }
    setInputTokenValue(value) {
        this.originalSwapPosition = true;
        this.inputTokenValue = value;
        this.inputReceiveValue = formatCurrency(value * this.exchangeRate);
    }
    setinputReceiveValue(value) {
        this.originalSwapPosition = false;
        this.inputReceiveValue = value;
        this.inputTokenValue = formatCurrency(value / this.exchangeRate);
    }
    reCalculateTokenInput(rate) {
        if (this.originalSwapPosition) {
            console.log('dung chieu');
            this.inputReceiveValue = formatCurrency(this.inputTokenValue * rate);
        } else {
            console.log('nguoc chieu');
            this.inputTokenValue = formatCurrency(this.inputReceiveValue / rate);
        }
    }
    calculateExchangeRate(sync) {
        if (this.payToken && this.receiveToken) {
            const payToken = this.tokensData.find((token) => token.currency === this.payToken);
            const receiveToken = this.tokensData.find((token) => token.currency === this.receiveToken);
            this.rateTokenPrice = payToken.price;
            this.rateReceivePrice = receiveToken.price;
            const rate = payToken.price / receiveToken.price;
            this.exchangeRate = rate;
            sync(rate);
        }
    }
    swapTokenInput() {
        [this.inputTokenValue, this.inputReceiveValue] = [this.inputReceiveValue, this.inputTokenValue];
    }
    swap() {
        this.originalSwapPosition = !this.originalSwapPosition;
        [this.payToken, this.receiveToken] = [this.receiveToken, this.payToken];
        [this.payTokenPriceToFiat, this.receiveTokenPriceToFiat] = [this.receiveTokenPriceToFiat, this.payTokenPriceToFiat];
        this.swapTokenInput();
    }

    static getInstance() {
        if (!TServices.instance) {
            TServices.instance = new TServices();
        }
        return TServices.instance;
    }
}

const TokenService = TServices.getInstance();

class Wallet {
    constructor() {
        this.web3 = null;
        this.address = null;
        this.currentBalance = 20;
    }

    async initInfo() {
        this.web3 = new Web3(window.ethereum);
        this.address = (await this.web3.eth.requestAccounts())[0];
        this.currentBalance = 20;
        // this.currentBalance = Web3.utils.fromWei(
        //     `${await this.web3.eth.getBalance(this.address)}`,
        //     "ether"
        // );
    };

    async connect() {
        if (window.ethereum) {
            if (window.ethereum.networkVersion != 1) {
                const chainID_HEX = await Web3.utils.numberToHex(1);
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: chainID_HEX }],
                    });
                    await this.initInfo();
                } catch (err) {
                    console.log(err);
                    return false;
                }
            } else {
                this.web3 = new Web3(window.ethereum);
                await this.initInfo();
            }
        }
    };

    async disconnect() {
        this.web3 = null;
        this.address = null;
        this.currentBalance = null;
    }

    async simulateSwap(objectData, callback) {
        const jsonData = JSON.stringify(objectData);

        try {
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [jsonData, this.address],
            });
            callback(TRANSACTION_STATUS.SUCCESS, signature);
        } catch (error) {
            callback(TRANSACTION_STATUS.FAILED, error);
        }

    }

    static getInstance() {
        if (!Wallet.instance) {
            Wallet.instance = new Wallet();
        }
        return Wallet.instance;
    }
}

const CryptoWallet = Wallet.getInstance();