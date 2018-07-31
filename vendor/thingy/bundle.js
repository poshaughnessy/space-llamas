var Thingy = (function () {
  'use strict';

  /*
  Copyright 2018 Kenneth Rohde Christiansen

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

  1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

  2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  function defineProperties(target, descriptions) {
    for (const property in descriptions) {
      Object.defineProperty(target, property, {
        configurable: true,
        value: descriptions[property],
      });
    }
  }

  const EventTargetMixin = (superclass, ...eventNames) => class extends superclass {
    constructor(...args) {
      super(args);
      const eventTarget = document.createDocumentFragment();


      this.addEventListener = (type, ...args) => {
        return eventTarget.addEventListener(type, ...args);
      };

      this.removeEventListener = (...args) => {
        return eventTarget.removeEventListener(...args);
      };

      this.dispatchEvent = (event) => {
        defineProperties(event, {currentTarget: this});
        if (!event.target) {
          defineProperties(event, {target: this});
        }

        const methodName = `on${event.type}`;
        if (typeof this[methodName] === "function") {
          this[methodName](event);
        }

        const retValue = eventTarget.dispatchEvent(event);

        if (retValue && this.parentNode) {
          this.parentNode.dispatchEvent(event);
        }

        defineProperties(event, {currentTarget: null, target: null});

        return retValue;
      };
    }
  };

  class EventTarget extends EventTargetMixin(Object) {}

  class Utilities extends EventTarget {
      constructor(device) {
        super();
    
        this.device = device;
      }
    

      async wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      processEvent(type, feature, body, target = this.device) {
        let eventObject;

        switch(true) {
          case (type === feature || type === "operationdiscarded"):
            eventObject = body;
            break;
          default: {
            eventObject = {
              feature,
              body,
            };

            break;
          }
        }

        const ce = new CustomEvent(type, {detail: eventObject});
    
        target.dispatchEvent(ce);
      }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class ThingyController {
    constructor(device) {

      // thingy id)
      this.setDevice(device);
      this.utilities = new Utilities(device);
      this._initialize();
    }

    _initialize() {
      if (window.thingyController === undefined) {
          window.thingyController = {};
        }

        if (window.thingyController[this.tid] === undefined) {
          window.thingyController[this.tid] = {};
        }

        if (window.thingyController[this.tid].gattStatus === undefined) {
          window.thingyController[this.tid].gattStatus = true;
        }

        if (window.thingyController[this.tid].queuedOperations === undefined) {
          window.thingyController[this.tid].queuedOperations = [];
        }

        if (window.thingyController[this.tid].executingQueuedOperations === undefined) {
          window.thingyController[this.tid].executingQueuedOperations = false;
        }

        if (window.thingyController[this.tid].executedOperations === undefined) {
          window.thingyController[this.tid].executedOperations = [];
        }
    }

    addExecutedOperation(feature, method) {
      if (this.device.getConnected()) {
        window.thingyController[this.tid].executedOperations.push({feature, method});
      }
    }

    clearExecutedOperations() {
      window.thingyController[this.tid].executedOperations = [];
    }

    setGattStatus(bool) {
      if (this.device.getConnected()) {
        window.thingyController[this.tid].gattStatus = bool;

        if (bool) {
          this.utilities.processEvent("gattavailable");
        }
      }
    }

    getGattStatus() {
      if (this.device.getConnected()) {
        return window.thingyController[this.tid].gattStatus;
      }
    }

    getNumQueuedOperations() {
      if (this.device.getConnected()) {
        return window.thingyController[this.tid].queuedOperations.length;
      }
    }

    getQueuedOperation(index) {
      if (this.device.getConnected()) {
        if (window.thingyController[this.tid].queuedOperations.length >= index) {
          return window.thingyController[this.tid].queuedOperations[index];
        }
      }
    }

    // removes either by index or by operation specifics (feature and method)
    removeQueuedOperation(x) {
      if (this.device.getConnected()) {
        if (Number.isInteger(x)) {
          window.thingyController[this.tid].queuedOperations.splice(x, 1);
        } else {
          for (let i=0;i<this.getNumQueuedOperations();i++) {
            const op = this.getQueuedOperation(i);
        
            if (x.feature === op.feature && x.method === op.method) {
              this.removeQueuedOperation(i);
              i--;
            }
          }
        }
      }
    }

    enqueue(feature, method, f) {
      if (this.device.getConnected()) {
        window.thingyController[this.tid].queuedOperations.push({feature, method, f});
        this.utilities.processEvent("operationqueued");
      }
    }

    dequeue() {
      if (this.device.getConnected()) {
        return window.thingyController[this.tid].queuedOperations.shift();
      }
    }

    setExecutingQueuedOperations(bool) {
      if (this.device.getConnected()) {
        window.thingyController[this.tid].executingQueuedOperations = bool;

        if (bool) {
         this.clearExecutedOperations();
        }
      }
    }

    getExecutingQueuedOperations() {
      if (this.device.getConnected()) {
        return window.thingyController[this.tid].executingQueuedOperations;
      }
    }

    getDevice() {
      return this.device;
    }

    setDevice(device) {
      this.device = device;
      this.tid = device.device.id;
    }

    getExecutedOperation(index) {
      if (this.device.getConnected()) {
        return window.thingyController[this.tid].executedOperations[index];
      }
    }

    getNumExecutedOperations() {
      if (this.device.getConnected()) {
        return window.thingyController[this.tid].executedOperations.length;
      }
    }

    terminate() {
      window.thingyController[this.tid] = undefined;
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class FeatureOperations {
    constructor(device, type) {
      this.device = device;
      this.utilities = new Utilities(this.device);
      this.type = type || this.constructor.name;
      this.latestReading = new Map();
    }

    async _connect() {
      if (!("thingyController" in this)) {
        // has to be put here rather than in the constructor as we need access to the id of the device
        // which is not accessible before the device has performed its connect method
        this.thingyController = new ThingyController(this.device);
      }

      this.thingyController.addExecutedOperation(this.type, "connect");
      
      if (("connected" in this.characteristic) && this.characteristic.connected) {
        if (this.device.logEnabled) {
          console.log(`You're already connected to the ${this.type} feature`);
        }

        return true;
      }

      if (this.thingyController.getGattStatus()) {
        try {
          this.thingyController.setGattStatus(false);

          this.service.service = await this.device.server.getPrimaryService(this.service.uuid);
          this.characteristic.characteristic = await this.service.service.getCharacteristic(this.characteristic.uuid);

          this.thingyController.setGattStatus(true);

          this.characteristic.connected = true;
          this.characteristic.notifying = false;
          this.characteristic.hasEventListener = false;

          /*
          // This approach needs to be fundamentally revised
          // For now we'll leave it here, commented out
          if (this.characteristic.verifyAction && this.characteristic.verifyReaction) {
            await this.characteristic.verifyAction();

            this.addEventListener("verifyReaction", this.characteristic.verifyReaction);

            const verifyValue = await this._notify(true, true);

            // something needs to be done here depending on the value returned
            // by the functions over. Could prove difficult, will have to see if
            // we can alter how verifyAction & verifyReaction works, as it's
            // only used by the microphone per now
          }*/

          if (this.device.logEnabled) {
            console.log(`Connected to the ${this.type} feature`);
          }

          return true;
        } catch (error) {
          if ("thingyController" in this) {
            this.thingyController.setGattStatus(true);
            this.thingyController.enqueue(this.type, "connect", this._connect.bind(this));
          }
          
          this.characteristic.connected = false;

          if ("utilities" in this) {
            this.utilities.processEvent("error", this.type, error);
          }
          
          return false;
        }
      } else {
        this.thingyController.enqueue(this.type, "connect", this._connect.bind(this));
        return false;
      }
    }

    async _read(returnRaw = false) {
      try {
        let connectIteration = 0;
        let readIteration = 0;
        let returnValue = false;

        if (!this.characteristic.connected) {
          await this._connect();
        }

        while (!this.characteristic.connected) {
          connectIteration++;

          if (connectIteration === 250) {
            const error = new Error(`As we couldn't connect to the ${this.type} feature, the read operation can't be executed`);
            this.utilities.processEvent("error", this.type, error);
            return false;
          }

          // waiting a set amount of time for any ongoing BLE operation to conclude
          await this.utilities.wait(20);
        }

        this.thingyController.addExecutedOperation(this.type, "read");

        if (!this.hasProperty("read")) {
          const error = new Error(`The ${this.type} feature does not support the read method`);
          this.utilities.processEvent("error", this.type, error);
          return false;
        }

        if (!this.characteristic.decoder) {
          const error = new Error("The characteristic you're trying to read does not have a specified decoder");
          this.utilities.processEvent("error", this.type, error);
          return false;
        }

        while (returnValue === false) {
          readIteration++;

          if (readIteration === 250) {
            const error = new Error("We could not process your read request at the moment due to high operational traffic");
            this.utilities.processEvent("error", this.type, error);
            return false;
          }

          if (this.thingyController.getGattStatus()) {
            this.thingyController.setGattStatus(false);
            let prop = await this.characteristic.characteristic.readValue();
            this.thingyController.setGattStatus(true);

            if (returnRaw !== true) {
              prop = await this.characteristic.decoder(prop);
            }

            returnValue = prop;
          } else {
            // waiting a set amount of time for any ongoing BLE operation to conclude
            await this.utilities.wait(20);
          }
        }

        return returnValue;
      } catch (error) {
        this.thingyController.setGattStatus(true);
        this.utilities.processEvent("error", this.type, error);
        return false;
      }
    }

    async _write(prop) {
      try {
        if (prop === undefined) {
          const error = new Error("You have to write a non-empty body");
          this.utilities.processEvent("error", this.type, error);
          return false;
        }

        let connectIteration = 0;
        let writeIteration = 0;
        let returnValue = false;

        if (!this.characteristic.connected) {
          await this._connect();
        }

        while (!this.characteristic.connected) {
          connectIteration++;

          if (connectIteration === 250) {
            const error = new Error(`As we couldn't connect to the ${this.type} feature, the write operation can't be executed`);
            this.utilities.processEvent("error", this.type, error);
            return false;
          }

          // waiting a set amount of time for any ongoing BLE operation to conclude
          await this.utilities.wait(20);
        }

        this.thingyController.addExecutedOperation(this.type, "write");

        if (!this.hasProperty("write") && !this.hasProperty("writeWithoutResponse")) {
          const error = new Error(`The ${this.type} feature does not support the write or writeWithoutResponse method`);
          this.utilities.processEvent("error", this.type, error);
          return false;
        }

        if (!this.characteristic.encoder) {
          const error = new Error("The characteristic you're trying to write does not have a specified encoder");
          this.utilities.processEvent("error", this.type, error);
          return false;
        }

        while (returnValue === false) {
          writeIteration++;

          if (writeIteration === 250) {
            const error = new Error("We could not process your read request at the moment due to high operational traffic");
            this.utilities.processEvent("error", this.type, error);
            return false;
          }

          if (this.thingyController.getGattStatus()) {
            const encodedProp = await this.characteristic.encoder(prop);
            this.thingyController.setGattStatus(false);
            await this.characteristic.characteristic.writeValue(encodedProp);
            this.thingyController.setGattStatus(true);

            // emit event for successful write
            this.utilities.processEvent("write", this.type, prop);

            returnValue = true;
          } else {
            // waiting a set amount of time for any ongoing BLE operation to conclude
            await this.utilities.wait(20);
          }
        }

        return returnValue;
      } catch (error) {
        this.thingyController.setGattStatus(true);
        this.utilities.processEvent("error", this.type, error);
        return false;
      }
    }

    async _notify(enable, verify = false) {
      if (!(enable === true || enable === false)) {
        const error = new Error("You have to specify the enable parameter (true/false)");
        this.utilities.processEvent("error", this.type, error);
        return;
      }

      if (!this.characteristic.connected) {
        const connected = await this._connect();

        if (!connected) {
          this.thingyController.enqueue(this.type, (enable ? "start" : "stop"), this._notify.bind(this, enable, verify));
          return false;
        }
      }

      this.thingyController.addExecutedOperation(this.type, (enable ? "start" : "stop"));

      if (!this.hasProperty("notify")) {
        const error = new Error(`The ${this.type} feature does not support the start/stop methods`);
        this.utilities.processEvent("error", this.type, error);
        return;
      }

      if (enable === this.characteristic.notifying) {
        if (this.device.logEnabled) {
          console.log(`The ${this.type} feature has already ${(this.characteristic.notifying ? "enabled" : "disabled")} notifications`);
        }
        // could also just return, but technically the operation
        // completed successfully as the desired outcome was achieved
        return true;
      }

      if (!this.characteristic.decoder) {
        const error = new Error("The characteristic you're trying to notify does not have a specified decoder");
        this.utilities.processEvent("error", this.type, error);
        return;
      }

      const onReading = async (e) => {
        try {
          const data = await this.characteristic.decoder(e.target.value);

          if (verify) ; else {
            this.utilities.processEvent(this.type, this.type, data);
          }
        } catch (error) {
          this.utilities.processEvent("error", this.type, error);
        }
      };

      const characteristic = this.characteristic.characteristic;

      if (this.thingyController.getGattStatus()) {
        this.thingyController.setGattStatus(false);
        if (enable) {
          try {
            const csn = await characteristic.startNotifications();
            this.thingyController.setGattStatus(true);
            
            if (!this.characteristic.hasEventListener) {
              csn.addEventListener("characteristicvaluechanged", onReading.bind(this));
              this.characteristic.hasEventListener = true;
            }

            this.characteristic.notifying = true;

            if (this.device.logEnabled) {
              console.log(`Notifications enabled for the ${this.type} feature`);
            }

            return true;
          } catch (error) {
            this.thingyController.setGattStatus(true);
            this.thingyController.enqueue(this.type, (enable ? "start" : "stop"), this._notify.bind(this, enable, verify));
            this.characteristic.notifying = false;
            this.utilities.processEvent("error", this.type, error);
            return false;
          }
        } else {
          try {
            const csn = await characteristic.stopNotifications();
            this.thingyController.setGattStatus(true);

            this.characteristic.notifying = false;

            // not ideal
            if (this.type === "microphone") {
              if (this.audioCtx) {
                this.suspendAudioContext();
              }
            }

            if (this.device.logEnabled) {
              console.log(`Notifications disabled for the ${this.type} feature`);
            }

            return true;
          } catch (error) {
            this.thingyController.setGattStatus(true);
            this.thingyController.enqueue(this.type, (enable ? "start" : "stop"), this._notify.bind(this, enable, verify));
            this.characteristic.notifying = true;
            this.utilities.processEvent("error", this.type, error);
            return false;
          }
        }
      } else {
        this.thingyController.enqueue(this.type, (enable ? "start" : "stop"), this._notify.bind(this, enable, verify));
        return false;
      }
    }

    hasProperty(property) {
      return (this.characteristic.characteristic.properties[property] === true ? true : false);
    }

    async start() {
      return await this._notify(true);
    }

    async stop() {
      return await this._notify(false);
    }

    async read() {
      return await this._read();
    }

    async write(data) {
      return await this._write(data);
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class AdvertisingParametersService extends FeatureOperations {
    constructor(device) {
      super(device, "advertisingparameters");

      // gatt service and characteristic used to communicate with thingy's advertising parameters configuration
      this.service = {
        uuid: this.device.TCS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TCS_ADV_PARAMS_UUID,
        decoder: this.decodeAdvertisingParam.bind(this),
        encoder: this.encodeAdvertisingParam.bind(this),
      };
    }

    decodeAdvertisingParam(data) {
      try {
        // Interval is given in units of 0.625 milliseconds
        const littleEndian = true;
        const interval = (data.getUint16(0, littleEndian) * 0.625).toFixed(0);
        const timeout = data.getUint8(2);
        const decodedAdvertisingParams = {
          interval: interval,
          timeout: timeout,
        };
        return decodedAdvertisingParams;
      } catch (error) {
        throw error;
      }
    }

    async encodeAdvertisingParam(params) {
      try {

        if (typeof params !== "object") {
          const error = new Error("The argument has to be an object.");
          throw error;
        }

        if ((params.interval === undefined) && (params.timeout === undefined)) {
          const error = new RangeError("The argument has to be an object with at least one of the properties 'interval' or 'timeout': {interval: someInterval, timeout: someTimeout}");
          throw error;
        }

        let interval = params.interval;
        let timeout = params.timeout;

        // Check parameters
        if (interval !== undefined) {
          if (interval < 20 || interval > 5000) {
            const error = new RangeError("The advertising interval must be within the range of 20 ms to 5 000 ms");
            throw error;
          }
          // Interval is in units of 0.625 ms.
          interval = interval * 1.6;
        }

        if (timeout !== undefined) {
          if (timeout < 0 || timeout > 180) {
            const error = new RangeError("The advertising timeout must be within the range of 0 to 180 s");
            throw error;
          }
        }

        const receivedData = await this._read(true);
        const littleEndian = true;
        interval = interval || receivedData.getUint16(0, littleEndian);
        timeout = timeout || receivedData.getUint8(2, littleEndian);

        const dataArray = new Uint8Array(3);
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = receivedData.getUint8(i);
        }

        dataArray[0] = interval & 0xff;
        dataArray[1] = (interval >> 8) & 0xff;
        dataArray[2] = timeout;

        return dataArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class Microphone extends FeatureOperations {
    constructor(device, eventListeners = []) {
      super(device, "microphone");

      // gatt service and characteristic used to communicate with Thingy's microphone
      this.service = {
        uuid: this.device.TSS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TSS_MIC_UUID,
        decoder: this.decodeMicrophoneData.bind(this),
        // verifyAction: this.verifyMicrophoneAction.bind(this),
        // verifyReaction: this.verifyMicrophoneReaction.bind(this),
      };

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      this._MICROPHONE_INDEX_TABLE = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

      this._MICROPHONE_STEP_SIZE_TABLE = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209,
        230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
        5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];

      this.suspendAudioContext = this.suspendAudioContext.bind(this);
    }

    async suspendAudioContext() {
      await this.audioCtx.suspend();
    }
    decodeMicrophoneData(event) {
      const audioPacket = event.buffer;
      const adpcm = {
        header: new DataView(audioPacket.slice(0, 3)),
        data: new DataView(audioPacket.slice(3)),
      };
      const decodedAudio = this._decodeAudio(adpcm);

      return decodedAudio;
    }

    async verifyMicrophoneAction() {
      try {
        await this.device.mtu._write(140);
      } catch (error) {
        throw error;
      }
    }

    async verifyMicrophoneReaction(data) {
      if (this.getGattAvailable()) {
        try {
          const microphoneData = data.detail.data;
          await this._notify(false, true);
          this.removeEventListener("verifyReaction", this.characteristic.verifyReaction);

          if (microphoneData.byteLength === 131) {
            await this._notify(true);
          } else {
            console.log(microphoneData.byteLength);
            const e = new Error("Your device does not currently support the use of Thingy's microphone. Check back at a later date.");
            this.notifyError(e);
            throw e;
          }
        } catch (error) {
          throw error;
        }
      }
    }

    _decodeAudio(adpcm) {
      try {
        // Allocate output buffer
        const audioBufferDataLength = adpcm.data.byteLength;
        const audioBuffer = new ArrayBuffer(512);
        const pcm = new DataView(audioBuffer);
        let diff;
        let bufferStep = false;
        let inputBuffer = 0;
        let delta = 0;
        let sign = 0;
        let step;

        // The first 2 bytes of ADPCM frame are the predicted value
        let valuePredicted = adpcm.header.getInt16(0, false);
        // The 3rd byte is the index value
        let index = adpcm.header.getInt8(2);
        if (index < 0) {
          index = 0;
        }
        if (index > 88) {
          index = 88;
        }
        step = this._MICROPHONE_STEP_SIZE_TABLE[index];
        for (let _in = 0, _out = 0; _in < audioBufferDataLength; _out += 2) {
          /* Step 1 - get the delta value */
          if (bufferStep) {
            delta = inputBuffer & 0x0F;
            _in++;
          } else {
            inputBuffer = adpcm.data.getInt8(_in);
            delta = (inputBuffer >> 4) & 0x0F;
          }
          bufferStep = !bufferStep;
          /* Step 2 - Find new index value (for later) */
          index += this._MICROPHONE_INDEX_TABLE[delta];
          if (index < 0) {
            index = 0;
          }
          if (index > 88) {
            index = 88;
          }
          /* Step 3 - Separate sign and magnitude */
          sign = delta & 8;
          delta = delta & 7;
          /* Step 4 - Compute difference and new predicted value */
          diff = (step >> 3);
          if ((delta & 4) > 0) {
            diff += step;
          }
          if ((delta & 2) > 0) {
            diff += (step >> 1);
          }
          if ((delta & 1) > 0) {
            diff += (step >> 2);
          }
          if (sign > 0) {
            valuePredicted -= diff;
          } else {
            valuePredicted += diff;
          }
          /* Step 5 - clamp output value */
          if (valuePredicted > 32767) {
            valuePredicted = 32767;
          } else if (valuePredicted < -32768) {
            valuePredicted = -32768;
          }
          /* Step 6 - Update step value */
          step = this._MICROPHONE_STEP_SIZE_TABLE[index];
          /* Step 7 - Output value */
          pcm.setInt16(_out, valuePredicted, true);
        }

        return pcm;
      } catch (error) {
        throw error;
      }
    }

    play(audio) {
      if (this._audioStack === undefined) {
        this._audioStack = [];
      }
      this._audioStack.push(audio);
      if (this._audioStack.length) {
        this._scheduleAudioBuffers();
      }
    }
    _scheduleAudioBuffers() {
      while (this._audioStack.length > 0) {
        const bufferTime = 0.01; // Buffer time in seconds before initial audio chunk is played
        const buffer = this._audioStack.shift();
        const channels = 1;
        const framecount = buffer.byteLength / 2;
        if (this._audioNextTime === undefined) {
          this._audioNextTime = 0;
        }
        if (this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }
        const myArrayBuffer = this.audioCtx.createBuffer(channels, framecount, 16000);
        // This gives us the actual array that contains the data
        const nowBuffering = myArrayBuffer.getChannelData(0);
        for (let i = 0; i < buffer.byteLength / 2; i++) {
          nowBuffering[i] = buffer.getInt16(2 * i, true) / 32768.0;
        }
        const source = this.audioCtx.createBufferSource();
        source.buffer = myArrayBuffer;
        source.connect(this.audioCtx.destination);
        if (this._audioNextTime === 0) {
          this._audioNextTime = this.audioCtx.currentTime + bufferTime;
        }
        source.start(this._audioNextTime);
        this._audioNextTime += source.buffer.duration;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class MTUService extends FeatureOperations {
    constructor(device) {
      super(device, "mtu");

      // gatt service and characteristic used to communicate with Thingy's MTU
      this.service = {
        uuid: this.device.TCS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TCS_MTU_REQUEST_UUID,
        decoder: this.decodeMtu.bind(this),
        encoder: this.encodeMtu.bind(this),
      };
    }

    decodeMtu(mtuSize) {
      try {
        const littleEndian = true;
        const mtu = mtuSize.getUint16(1, littleEndian);

        return mtu;
      } catch (error) {
        throw error;
      }
    }

    encodeMtu(mtuSize, peripheralRequest = true) {
      try {
        if (mtuSize < 23 || mtuSize > 276) {
          const e = new Error("MTU size must be in range 23 - 276 bytes");
          throw e;
        }

        const dataArray = new Uint8Array(3);
        dataArray[0] = peripheralRequest? 1 : 0;
        dataArray[1] = mtuSize & 0xff;
        dataArray[2] = (mtuSize >> 8) & 0xff;
        return dataArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class NameService extends FeatureOperations {
    constructor(device) {
      super(device, "name");

      // gatt service and characteristic used to communicate with Thingy's name configuration
      this.service = {
        uuid: this.device.TCS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TCS_NAME_UUID,
        decoder: this.decodeName.bind(this),
        encoder: this.encodeName.bind(this),
      };
    }

    decodeName(data) {
      try {
        const decoder = new TextDecoder();
        const name = decoder.decode(data);
        const decodedName = {
          name: name,
        };
        return decodedName;
      } catch (error) {
        throw error;
      }
    }

    encodeName(data) {
      try {
        if (data.length > 10) {
          return Promise.reject(new TypeError("The name can't be more than 10 characters long."));
        }
        const encodedName = new Uint8Array(data.length);

        for (let i = 0; i < data.length; i += 1) {
          encodedName[i] = data.charCodeAt(i);
        }
        return encodedName;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class TemperatureSensor extends FeatureOperations {
    constructor(device) {
      super(device, "temperature");

      // gatt service and characteristic used to communicate with Thingy's temperature sensor
      this.service = {
        uuid: this.device.TES_UUID,
      };

      this.characteristic = {
        uuid: this.device.TES_TEMP_UUID,
        decoder: this.decodeTemperature.bind(this),
      };
    }

    decodeTemperature(data) {
      try {
        const integer = data.getInt8(0);
        const decimal = data.getUint8(1);
        const temperature = integer + decimal / 100;

        const decodedTemperature = {
          value: temperature,
          unit: "Celsius",
        };

        return decodedTemperature;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class PressureSensor extends FeatureOperations {
    constructor(device) {
      super(device, "pressure");

      // gatt service and characteristic used to communicate with Thingy's pressure sensor
      this.service = {
        uuid: this.device.TES_UUID,
      };

      this.characteristic = {
        uuid: this.device.TES_PRESSURE_UUID,
        decoder: this.decodePressureData.bind(this),
      };
    }

    decodePressureData(data) {
      try {
        const littleEndian = true;
        const integer = data.getUint32(0, littleEndian);
        const decimal = data.getUint8(4);
        const pressure = integer + decimal / 100;
        const formattedData = {
          value: pressure,
          unit: "hPa",
        };
        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class LEDService extends FeatureOperations {
    constructor(device) {
      super(device, "led");

      // gatt service and characteristic used to communicate with Thingy's LED
      this.service = {
        uuid: this.device.TUIS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TUIS_LED_UUID,
        decoder: this.decodeLedData.bind(this),
        encoder: this.encodeLedData.bind(this),
      };
    }

    decodeLedData(data) {
      try {
        const mode = data.getUint8(0);
        const littleEndian = true;
        let status;

        switch (mode) {
        case 0:
          status = {
            mode: mode,
          };
          break;
        case 1:
          status = {
            mode: mode,
            r: data.getUint8(1),
            g: data.getUint8(2),
            b: data.getUint8(3),
          };
          break;
        case 2:
          status = {
            mode: mode,
            color: data.getUint8(1),
            intensity: data.getUint8(2),
            delay: data.getUint16(3, littleEndian),
          };
          break;
        case 3:
          status = {
            mode: mode,
            color: data.getUint8(1),
            intensity: data.getUint8(2),
          };
          break;
        }
        return status;
      } catch (error) {
        throw error;
      }
    }

    encodeLedData(data) {
      try {
        let dataArray;

        if (!data.mode) {
          const error = new Error("You must specify a LED mode");
          throw error;
        }

        switch (data.mode) {
        case "constant": {
          if (data.red === undefined || data.green === undefined || data.blue === undefined) {
            const e = new Error("The options object for constant mode must contain the properties 'red', 'green', and 'blue'.");
            throw e;
          }

          if (
            data.red < 0 ||
            data.red > 255 ||
            data.green < 0 ||
            data.green > 255 ||
            data.blue < 0 ||
            data.blue > 255
          ) {
            const e = new Error("The color values must be in the range 0 - 255");
            throw e;
          }

          dataArray = new Uint8Array([1, data.red, data.green, data.blue]);
          break;
        }

        case "breathe": {
          if (data.color === undefined || data.intensity === undefined || data.delay === undefined) {
            const e = new Error("The options object for breathe mode must have the properties 'color', 'intensity' and 'delay'.");
            throw e;
          }

          const colors = ["red", "green", "yellow", "blue", "purple", "cyan", "white"];
          let colorCode;

          if (colors.indexOf(data.color) > -1) {
            colorCode = colors.indexOf(data.color) + 1;
          } else if (typeof data.color === "number" && (data.color > 0 && data.color < 8)) {
            colorCode = data.color;
          } else {
            const e = new Error(`The color must either be a recognized color (${colors.join(", ")}), or an integer in the interval 1 - 7`);
            throw e;
          }

          if (data.intensity < 0 || data.intensity > 100) {
            const e = new Error("The intensity must be an integer in the interval 0 - 100");
            throw e;
          }

          if (data.delay < 50 || data.delay > 10000) {
            const e = new Error("The delay must be an integer in the interval 50 - 10 000");
            throw e;
          }

          dataArray = new Uint8Array([2, colorCode, data.intensity, data.delay & 0xff, (data.delay >> 8) & 0xff]);
          break;
        }

        case "oneshot": {
          if (data.color === undefined || data.intensity === undefined) {
            const e = new Error("The options object for the one shot mode must have the properties 'color' and 'intensity.");
            throw e;
          }

          if (data.color < 1 || data.color > 7) {
            const e = new Error("The color must either be a recognized color or an integer in the interval 1 - 7");
            throw e;
          }

          if (data.intensity < 0 || data.intensity > 100) {
            const e = new Error("The intensity must be an integer in the interval 0 - 100");
            throw e;
          }

          dataArray = new Uint8Array([3, data.color, data.intensity]);
          break;
        }

        case "off": {
          dataArray = new Uint8Array([0]);
          break;
        }

        default: {
          dataArray = new Uint8Array([2, 6, 20, 3500]);
          break;
        }
        }

        return dataArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class TapSensor extends FeatureOperations {
    constructor(device) {
      super(device, "tap");

      // gatt service and characteristic used to communicate with Thingy's tap sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_TAP_UUID,
        decoder: this.decodeTapData.bind(this),
      };
    }

    decodeTapData(data) {
      try {
        const direction = data.getUint8(0);
        const count = data.getUint8(1);

        const formattedData = {
          direction,
          count,
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class AbsoluteOrientationSensor extends FeatureOperations {
    constructor(device) {
      super(device, "absoluteorientation");

      // gatt service and characteristic used to communicate with Thingy's orientation sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_ORIENTATION_UUID,
        decoder: this.decodeOrientationData.bind(this),
      };
    }

    decodeOrientationData(data) {
      try {
        const orientation = data.getUint8(0);

        const formattedData = {
          orientation,
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class QuaternionOrientationSensor extends FeatureOperations {
    constructor(device) {
      super(device, "quaternionorientation");

      // gatt service and characteristic used to communicate with Thingy's quaternion sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_QUATERNION_UUID,
        decoder: this.decodeQuaternionData.bind(this),
      };
    }

    decodeQuaternionData(data) {
      try {
        const littleEndian = true;
        let w = data.getInt32(0, littleEndian) / (1 << 30);
        let x = data.getInt32(4, littleEndian) / (1 << 30);
        let y = data.getInt32(8, littleEndian) / (1 << 30);
        let z = data.getInt32(12, littleEndian) / (1 << 30);
        const magnitude = Math.sqrt(Math.pow(w, 2) + Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

        if (magnitude !== 0) {
          w /= magnitude;
          x /= magnitude;
          y /= magnitude;
          z /= magnitude;
        }

        const formattedData = {
          w,
          x,
          y,
          z,
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class ButtonSensor extends FeatureOperations {
    constructor(device) {
      super(device, "button");

      // gatt service and characteristic used to communicate with Thingy's button state
      this.service = {
        uuid: this.device.TUIS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TUIS_BTN_UUID,
        decoder: this.decodeButtonData.bind(this),
      };
    }

    decodeButtonData(data) {
      try {
        const state = data.getUint8(0);
        const decodedButton = {
          value: state,
        };
        return decodedButton;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class CloudTokenService extends FeatureOperations {
    constructor(device) {
      super(device, "cloudtoken");

      // gatt service and characteristic used to communicate with Thingy's cloud configuration
      this.service = {
        uuid: this.device.TCS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TCS_CLOUD_TOKEN_UUID,
        decoder: this.decodeCloudToken.bind(this),
        encoder: this.encodeCloudToken.bind(this),
      };
    }

    decodeCloudToken(data) {
      try {
        const decoder = new TextDecoder();
        const token = decoder.decode(data);

        const decodedToken = {
          token: token,
        };
        return decodedToken;
      } catch (error) {
        throw error;
      }
    }

    encodeCloudToken(token) {
      try {
        if (token.length > 250) {
          const error = new Error("The length of the cloud token can not exceed 250 characters.");
          throw error;
        }

        const encoder = new TextEncoder();
        const encodedToken = encoder.encode(token);

        return encodedToken;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class ColorSensor extends FeatureOperations {
    constructor(device) {
      super(device, "color");

      // gatt service and characteristic used to communicate with thingy's color sensor
      this.service = {
        uuid: this.device.TES_UUID,
      };

      this.characteristic = {
        uuid: this.device.TES_COLOR_UUID,
        decoder: this.decodeColorData.bind(this),
      };
    }

    decodeColorData(data) {
      try {
        const littleEndian = true;
        const r = data.getUint16(0, littleEndian);
        const g = data.getUint16(2, littleEndian);
        const b = data.getUint16(4, littleEndian);
        const c = data.getUint16(6, littleEndian);
        const rRatio = r / (r + g + b);
        const gRatio = g / (r + g + b);
        const bRatio = b / (r + g + b);
        const clearAtBlack = 300;
        const clearAtWhite = 400;
        const clearDiff = clearAtWhite - clearAtBlack;
        let clearNormalized = (c - clearAtBlack) / clearDiff;

        if (clearNormalized < 0) {
          clearNormalized = 0;
        }

        let red = rRatio * 255.0 * 3 * clearNormalized;
        if (red > 255) {
          red = 255;
        }

        let green = gRatio * 255.0 * 3 * clearNormalized;
        if (green > 255) {
          green = 255;
        }

        let blue = bRatio * 255.0 * 3 * clearNormalized;
        if (blue > 255) {
          blue = 255;
        }

        const formattedData = {
          red: parseInt(red.toFixed(0)),
          green: parseInt(green.toFixed(0)),
          blue: parseInt(blue.toFixed(0)),
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class ConnectionParametersService extends FeatureOperations {
    constructor(device) {
      super(device, "connectionparameters");

      // gatt service and characteristic used to communicate with Thingy's connection parameters configuration
      this.service = {
        uuid: this.device.TCS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TCS_CONN_PARAMS_UUID,
        decoder: this.decodeConnectionParam.bind(this),
        encoder: this.encodeConnectionParam.bind(this),
      };
    }

    decodeConnectionParam(data) {
      try {
        // Connection intervals are given in units of 1.25 ms
        const littleEndian = true;
        const minConnInterval = data.getUint16(0, littleEndian) * 1.25;
        const maxConnInterval = data.getUint16(2, littleEndian) * 1.25;
        const slaveLatency = data.getUint16(4, littleEndian);

        // Supervision timeout is given i units of 10 ms
        const supervisionTimeout = data.getUint16(6, littleEndian) * 10;
        const params = {
          minInterval: minConnInterval,
          maxInterval: maxConnInterval,
          slaveLatency: slaveLatency,
          timeout: supervisionTimeout,
        };
        return params;
      } catch (error) {
        throw error;
      }
    }

    async encodeConnectionParam(params) {
      try {
        if (typeof params !== "object") {
          const error = new Error("The argument has to be an object.");
          throw error;
        }

        if ((params.timeout === undefined) && (params.slaveLatency === undefined) && (params.minInterval === undefined) && (params.maxInterval === undefined)) {
          const error = new Error("The argument has to be an object with at least one of the properties 'timeout', 'slaveLatency', 'minInterval' or 'maxInterval'.");
          throw error;
        }

        let timeout = params.timeout;
        let slaveLatency = params.slaveLatency;
        let minInterval = params.minInterval;
        let maxInterval = params.maxInterval;

        // Check parameters
        if (timeout !== undefined) {
          if (timeout < 100 || timeout > 32000) {
            const error = new Error("The supervision timeout must be in the range from 100 ms to 32 000 ms.");
            throw error;
          }
          // The supervision timeout has to be set in units of 10 ms
          timeout = Math.round(timeout / 10);
        }

        if (slaveLatency !== undefined) {
          if (slaveLatency < 0 || slaveLatency > 499) {
            const error = new Error("The slave latency must be in the range from 0 to 499 connection intervals.");
            throw error;
          }
        }

        if (minInterval !== undefined) {
          if (minInterval < 7.5 || minInterval > maxInterval) {
            const error = new Error("The minimum connection interval must be greater than 7.5 ms and <= maximum interval");
            throw error;
          }
          // Interval is in units of 1.25 ms.
          minInterval = Math.round(minInterval * 0.8);
        }

        if (maxInterval !== undefined) {
          if (maxInterval > 4000 || maxInterval < minInterval) {
            const error = new Error("The minimum connection interval must be less than 4 000 ms and >= minimum interval");
            throw error;
          }
          // Interval is in units of 1.25 ms.
          maxInterval = Math.round(maxInterval * 0.8);
        }

        const receivedData = await this._read(true);
        const littleEndian = true;
        minInterval = minInterval || receivedData.getUint16(0, littleEndian);
        maxInterval = maxInterval || receivedData.getUint16(2, littleEndian);
        slaveLatency = slaveLatency || receivedData.getUint16(4, littleEndian);
        timeout = timeout || receivedData.getUint16(6, littleEndian);

        // Check that the timeout obeys  conn_sup_timeout * 4 > (1 + slave_latency) * max_conn_interval
        if (timeout * 4 < (1 + slaveLatency) * maxInterval) {
          const error = new Error("The supervision timeout in milliseconds must be greater than (1 + slaveLatency) * maxConnInterval * 2, where maxConnInterval is also given in milliseconds.");
          throw error;
        }

        const dataArray = new Uint8Array(8);
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = receivedData.getUint8(i);
        }

        dataArray[0] = minInterval & 0xff;
        dataArray[1] = (minInterval >> 8) & 0xff;
        dataArray[2] = maxInterval & 0xff;
        dataArray[3] = (maxInterval >> 8) & 0xff;
        dataArray[4] = slaveLatency & 0xff;
        dataArray[5] = (slaveLatency >> 8) & 0xff;
        dataArray[6] = timeout & 0xff;
        dataArray[7] = (timeout >> 8) & 0xff;

        return dataArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class FirmwareService extends FeatureOperations {
    constructor(device) {
      super(device, "firmware");

      // gatt service and characteristic used to communicate with Thingy's firmware version configuration
      this.service = {
        uuid: this.device.TCS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TCS_FW_VER_UUID,
        decoder: this.decodeFirmwareVersion.bind(this),
      };
    }

    decodeFirmwareVersion(data) {
      try {
        const major = data.getUint8(0);
        const minor = data.getUint8(1);
        const patch = data.getUint8(2);
        const version = `v${major}.${minor}.${patch}`;

        const decodedVersion = {
          firmware: version,
        };

        return decodedVersion;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class GasSensor extends FeatureOperations {
    constructor(device) {
      super(device, "gas");

      // gatt service and characteristic used to communicate with Thingy's gas sensor
      this.service = {
        uuid: this.device.TES_UUID,
      };

      this.characteristic = {
        uuid: this.device.TES_GAS_UUID,
        decoder: this.decodeGasData.bind(this),
      };
    }

    decodeGasData(data) {
      try {
        const littleEndian = true;
        const eco2 = data.getUint16(0, littleEndian);
        const tvoc = data.getUint16(2, littleEndian);
        const formattedData = {
          eCO2: {
            value: eco2,
            unit: "ppm",
          },
          TVOC: {
            value: tvoc,
            unit: "ppb",
          },
        };
        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class GravityVectorSensor extends FeatureOperations {
    constructor(device) {
      super(device, "gravityvector");

      // gatt service and characteristic used to communicate with Thingy's gravity vector sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_GRAVITY_UUID,
        decoder: this.decodeGravityVectorData.bind(this),
      };
    }

    decodeGravityVectorData(data) {
      try {
        const x = data.getFloat32(0, true);
        const y = data.getFloat32(4, true);
        const z = data.getFloat32(8, true);

        const formattedData = {
          value: {x: x, y: y, z: z},
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class HumiditySensor extends FeatureOperations {
    constructor(device) {
      super(device, "humidity");

      // gatt service and characteristic used to communicate with Thingy's humidity sensor
      this.service = {
        uuid: this.device.TES_UUID,
      };

      this.characteristic = {
        uuid: this.device.TES_HUMIDITY_UUID,
        decoder: this.decodeHumidityData.bind(this),
      };
    }

    decodeHumidityData(data) {
      try {
        const humidity = data.getUint8(0);

        const formattedData = {
          value: humidity,
          unit: "%",
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class StepCounterSensor extends FeatureOperations {
    constructor(device) {
      super(device, "stepcounter");

      // gatt service and characteristic used to communicate with Thingy's step counter sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_STEP_UUID,
        decoder: this.decodeStepData.bind(this),
      };
    }

    decodeStepData(data) {
      try {
        const littleEndian = true;
        const count = data.getUint32(0, littleEndian);
        const time = data.getUint32(4, littleEndian);

        const formattedData = {
          count,
          time: {
            value: time,
            unit: "ms",
          },
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class RawDataSensor extends FeatureOperations {
    constructor(device) {
      super(device, "rawdata");

      // gatt service and characteristic used to communicate with Thingy's raw data sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_RAW_UUID,
        decoder: this.decodeRawDataData.bind(this),
      };
    }

    decodeRawDataData(data) {
      try {
        const littleEndian = true;
        const accX = data.getInt16(0, littleEndian) / 64;
        const accY = data.getInt16(2, littleEndian) / 64;
        const accZ = data.getInt16(4, littleEndian) / 64;

        // Divide by 2^11 = 2048 to get correct gyroscope values
        const gyroX = data.getInt16(6, littleEndian) / 2048;
        const gyroY = data.getInt16(8, littleEndian) / 2048;
        const gyroZ = data.getInt16(10, littleEndian) / 2048;

        // Divide by 2^12 = 4096 to get correct compass values
        const compassX = data.getInt16(12, littleEndian) / 4096;
        const compassY = data.getInt16(14, littleEndian) / 4096;
        const compassZ = data.getInt16(16, littleEndian) / 4096;

        const formattedData = {
          accelerometer: {
            x: accX,
            y: accY,
            z: accZ,
            unit: "G",
          },
          gyroscope: {
            x: gyroX,
            y: gyroY,
            z: gyroZ,
            unit: "deg/s",
          },
          compass: {
            x: compassX,
            y: compassY,
            z: compassZ,
            unit: "microTesla",
          },
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class EulerOrientationSensor extends FeatureOperations {
    constructor(device) {
      super(device, "eulerorientation");

      // gatt service and characteristic used to communicate with Thingy's euler sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_EULER_UUID,
        decoder: this.decodeEulerData.bind(this),
      };
    }

    decodeEulerData(data) {
      try {
        const littleEndian = true;

        const roll = data.getInt32(0, littleEndian) / 65536;
        const pitch = data.getInt32(4, littleEndian) / 65536;
        const yaw = data.getInt32(8, littleEndian) / 65536;

        const formattedData = {
          roll,
          pitch,
          yaw,
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class RotationMatrixOrientationSensor extends FeatureOperations {
    constructor(device) {
      super(device, "rotationmatrixorientation");

      // gatt service and characteristic used to communicate with Thingy's rotation matrix sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_ROT_MATRIX_UUID,
        decoder: this.decodeRotationData.bind(this),
      };
    }

    decodeRotationData(data) {
      try {
        // Divide by 2^2 = 4 to get correct values
        const r1c1 = data.getInt16(0, true) / 4;
        const r1c2 = data.getInt16(0, true) / 4;
        const r1c3 = data.getInt16(0, true) / 4;
        const r2c1 = data.getInt16(0, true) / 4;
        const r2c2 = data.getInt16(0, true) / 4;
        const r2c3 = data.getInt16(0, true) / 4;
        const r3c1 = data.getInt16(0, true) / 4;
        const r3c2 = data.getInt16(0, true) / 4;
        const r3c3 = data.getInt16(0, true) / 4;

        const formattedData = {
          row1: [r1c1, r1c2, r1c3],
          row2: [r2c1, r2c2, r2c3],
          row3: [r3c1, r3c2, r3c3],
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class HeadingSensor extends FeatureOperations {
    constructor(device) {
      super(device, "heading");

      // gatt service and characteristic used to communicate with Thingy's heading sensor
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_HEADING_UUID,
        decoder: this.decodeHeadingData.bind(this),
      };
    }

    decodeHeadingData(data) {
      try {
        const littleEndian = true;
        const heading = data.getInt32(0, littleEndian) / 65536;

        const formattedData = {
          heading,
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class EddystoneUrlService extends FeatureOperations {
    constructor(device) {
      super(device, "eddystone");

      // gatt service and characteristic used to communicate with Thingy's Eddystone url
      this.service = {
        uuid: this.device.TCS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TCS_EDDYSTONE_UUID,
        decoder: this.decodeEddystoneData.bind(this),
        encoder: this.encodeEddystoneData.bind(this),
      };
    }

    decodeEddystoneData(data) {
      try {
        // According to Eddystone URL encoding specification, certain elements can be expanded: https://github.com/google/eddystone/tree/master/eddystone-url
        const prefixArray = ["http://www.", "https://www.", "http://", "https://"];
        const expansionCodes = [
          ".com/",
          ".org/",
          ".edu/",
          ".net/",
          ".info/",
          ".biz/",
          ".gov/",
          ".com",
          ".org",
          ".edu",
          ".net",
          ".info",
          ".biz",
          ".gov",
        ];
        const prefix = prefixArray[data.getUint8(0)];
        const decoder = new TextDecoder();
        let url = decoder.decode(data);
        url = prefix + url.slice(1);

        expansionCodes.forEach((element, i) => {
          if (url.indexOf(String.fromCharCode(i)) !== -1) {
            url = url.replace(String.fromCharCode(i), expansionCodes[i]);
          }
        });

        return new URL(url);
      } catch (error) {
        throw error;
      }
    }

    encodeEddystoneData(data) {
      try {
        // Uses URL API to check for valid URL
        const url = new URL(data);

        // Eddystone URL specification defines codes for URL scheme prefixes and expansion codes in the URL.
        // The array index corresponds to the defined code in the specification.
        // Details here: https://github.com/google/eddystone/tree/master/eddystone-url
        const prefixArray = ["http://www.", "https://www.", "http://", "https://"];
        const expansionCodes = [
          ".com/",
          ".org/",
          ".edu/",
          ".net/",
          ".info/",
          ".biz/",
          ".gov/",
          ".com",
          ".org",
          ".edu",
          ".net",
          ".info",
          ".biz",
          ".gov",
        ];

        let prefixCode = null;
        let expansionCode = null;
        let eddystoneUrl = url.href;
        let len = eddystoneUrl.length;

        prefixArray.forEach((element, i) => {
          if (url.href.indexOf(element) !== -1 && prefixCode === null) {
            prefixCode = String.fromCharCode(i);
            eddystoneUrl = eddystoneUrl.replace(element, prefixCode);
            len -= element.length;
          }
        });

        expansionCodes.forEach((element, i) => {
          if (url.href.indexOf(element) !== -1 && expansionCode === null) {
            expansionCode = String.fromCharCode(i);
            eddystoneUrl = eddystoneUrl.replace(element, expansionCode);
            len -= element.length;
          }
        });

        if (len < 1 || len > 14) {
          const error = new Error("The URL can't be longer than 14 characters, excluding URL scheme such as \"https://\" and \".com/\".");
          throw error;
        }

        const byteArray = new Uint8Array(eddystoneUrl.length);

        for (let i = 0; i < eddystoneUrl.length; i++) {
          byteArray[i] = eddystoneUrl.charCodeAt(i);
        }

        return byteArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class EnvironmentConfigurationService extends FeatureOperations {
    constructor(device) {
      super(device, "environmentconfiguration");

      // gatt service and characteristic used to communicate with thingy's environment configuration characteristic
      this.service = {
        uuid: this.device.TES_UUID,
      };

      this.characteristic = {
        uuid: this.device.TES_CONFIG_UUID,
        decoder: this.decodeConfigData.bind(this),
        encoder: this.encodeConfigData.bind(this),
      };
    }

    decodeConfigData(data) {
      try {
        const littleEndian = true;
        const temperatureInterval = data.getUint16(0, littleEndian);
        const pressureInterval = data.getUint16(2, littleEndian);
        const humidityInterval = data.getUint16(4, littleEndian);
        const colorInterval = data.getUint16(6, littleEndian);
        let gasInterval = data.getUint8(8);
        const colorSensorRed = data.getUint8(9);
        const colorSensorGreen = data.getUint8(10);
        const colorSensorBlue = data.getUint8(11);

        if (gasInterval === 1) {
          gasInterval = 1;
        } else if (gasInterval === 2) {
          gasInterval = 10;
        } else if (gasInterval === 3) {
          gasInterval = 60;
        }

        const formattedData = {
          temperatureInterval: temperatureInterval,
          pressureInterval: pressureInterval,
          humidityInterval: humidityInterval,
          colorInterval: colorInterval,
          gasInterval: gasInterval,
          colorSensorCalibration: {
            red: colorSensorRed,
            green: colorSensorGreen,
            blue: colorSensorBlue,
          },
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }

    async encodeConfigData(params) {
      try {
        if (typeof params !== "object") {
          return Promise.reject(new TypeError("The argument has to be an object."));
        }

        if ((params.temperatureInterval === undefined) && (params.pressureInterval === undefined) && (params.humidityInterval === undefined) && (params.colorInterval === undefined) && (params.gasInterval === undefined) && (params.colorSensorCalibration === undefined)) {
          return Promise.reject(new TypeError("The argument has to be an object with at least one of the properties 'temperatureInterval', 'pressureInterval', 'humidityInterval', 'colorInterval', 'gasInterval' or 'colorSensorCalibration'."));
        }

        let temperatureInterval = params.temperatureInterval;
        let pressureInterval = params.pressureInterval;
        let humidityInterval = params.humidityInterval;
        let colorInterval = params.colorInterval;
        let gasInterval = params.gasInterval;
        const colorSensorCalibration = params.colorSensorCalibration;

        if (temperatureInterval !== undefined) {
          if (temperatureInterval < 100 || temperatureInterval > 60000) {
            return Promise.reject(new RangeError("The temperature sensor sampling interval must be in the range 100 ms - 60 000 ms"));
          }
        }

        if (pressureInterval !== undefined) {
          if (pressureInterval < 50 || pressureInterval > 60000) {
            return Promise.reject(new RangeError("The pressure sensor sampling interval must be in the range 50 ms - 60 000 ms"));
          }
        }

        if (humidityInterval !== undefined) {
          if (humidityInterval < 100 || humidityInterval > 60000) {
            return Promise.reject(new RangeError("The humidity sensor sampling interval must be in the range 100 ms - 60 000 ms"));
          }
        }

        if (colorInterval !== undefined) {
          if (colorInterval < 200 || colorInterval > 60000) {
            return Promise.reject(new RangeError("The color sensor sampling interval must be in the range 200 ms - 60 000 ms"));
          }
        }

        if (gasInterval !== undefined) {
          if (gasInterval === 1) {
            gasInterval = 1;
          } else if (gasInterval === 10) {
            gasInterval = 2;
          } else if (gasInterval === 60) {
            gasInterval = 3;
          } else {
            const e = new RangeError("The gas sensor sampling interval has to be 1, 10 or 60 seconds.");
            throw e;
          }
        }

        let colorSensorRed;
        let colorSensorGreen;
        let colorSensorBlue;
        if (colorSensorCalibration !== undefined) {
          if (typeof colorSensorCalibration !== "object") {
            return Promise.reject(new TypeError("The colorSensorCalibration argument has to be an object."));
          }
          if (colorSensorCalibration.red === undefined || colorSensorCalibration.green === undefined || colorSensorCalibration.blue === undefined) {
            return Promise.reject(new TypeError("The colorSensorCalibration argument has to be an object with the properties red, green and blue."));
          }

          colorSensorRed = colorSensorCalibration.red;
          colorSensorGreen = colorSensorCalibration.green;
          colorSensorBlue = colorSensorCalibration.blue;
        }

        // Preserve values for those settings that are not being changed
        const receivedData = await this._read(true);
        const littleEndian = true;
        temperatureInterval = temperatureInterval || receivedData.getUint16(0, littleEndian);
        pressureInterval = pressureInterval || receivedData.getUint16(2, littleEndian);
        humidityInterval = humidityInterval || receivedData.getUint16(4, littleEndian);
        colorInterval = colorInterval || receivedData.getUint16(6, littleEndian);
        gasInterval = gasInterval || receivedData.getUint8(8);
        colorSensorRed = colorSensorRed || receivedData.getUint8(9);
        colorSensorGreen = colorSensorGreen|| receivedData.getUint8(10);
        colorSensorBlue = colorSensorBlue || receivedData.getUint8(11);

        const dataArray = new Uint8Array(12);
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = receivedData.getUint8(i);
        }

        dataArray[0] = temperatureInterval & 0xff;
        dataArray[1] = (temperatureInterval >> 8) & 0xff;
        dataArray[2] = pressureInterval & 0xff;
        dataArray[3] = (pressureInterval >> 8) & 0xff;
        dataArray[4] = humidityInterval & 0xff;
        dataArray[5] = (humidityInterval >> 8) & 0xff;
        dataArray[6] = colorInterval & 0xff;
        dataArray[7] = (colorInterval >> 8) & 0xff;
        dataArray[8] = gasInterval;
        dataArray[9] = colorSensorRed;
        dataArray[10] = colorSensorGreen;
        dataArray[11] = colorSensorBlue;

        return dataArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class MotionConfigurationService extends FeatureOperations {
    constructor(device) {
      super(device, "motionconfiguration");

      // gatt service and characteristic used to communicate with thingy's motion configuration characteristic
      this.service = {
        uuid: this.device.TMS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TMS_CONFIG_UUID,
        decoder: this.decodeConfigData.bind(this),
        encoder: this.encodeConfigData.bind(this),
      };
    }

    decodeConfigData(data) {
      try {
        const littleEndian = true;
        const stepCounterInterval = data.getUint16(0, littleEndian);
        const tempCompensationInterval = data.getUint16(2, littleEndian);
        const magnetCompInterval = data.getUint16(4, littleEndian);
        const motionProcessFrequency = data.getUint16(6, littleEndian);
        const wakeOnMotion = data.getUint8(8);

        const formattedData = {
          stepCounterInterval: stepCounterInterval,
          tempCompensationInterval: tempCompensationInterval,
          magnetCompInterval: magnetCompInterval,
          motionProcessFrequency: motionProcessFrequency,
          wakeOnMotion: wakeOnMotion,
        };

        return formattedData;
      } catch (error) {
        throw error;
      }
    }

    async encodeConfigData(params) {
      try {
        if (typeof params !== "object") {
          return Promise.reject(new TypeError("The argument has to be an object."));
        }

        if ((params.stepCounterInterval === undefined) && (params.tempCompensationInterval === undefined) && (params.magnetCompInterval === undefined) && (params.motionProcessFrequency === undefined) && (params.wakeOnMotion === undefined)) {
          return Promise.reject(new TypeError("The argument has to be an object with at least one of the properties 'stepCounterInterval', 'tempCompensationInterval', 'magnetCompInterval', 'motionProcessFrequency' or 'wakeOnMotion'."));
        }

        let stepCounterInterval = params.stepCounterInterval;
        let tempCompensationInterval = params.tempCompensationInterval;
        let magnetCompInterval = params.magnetCompInterval;
        let motionProcessFrequency = params.motionProcessFrequency;
        let wakeOnMotion = params.wakeOnMotion;

        if (stepCounterInterval !== undefined) {
          if (stepCounterInterval < 100 || stepCounterInterval > 5000) {
            return Promise.reject(new RangeError("The step counter interval must be in the range 100 ms - 5000 ms"));
          }
        }

        if (tempCompensationInterval !== undefined) {
          if (tempCompensationInterval < 100 || tempCompensationInterval > 5000) {
            return Promise.reject(new RangeError("The temperature compensation interval must be in the range 100 ms - 5000 ms"));
          }
        }

        if (magnetCompInterval !== undefined) {
          if (magnetCompInterval < 100 || magnetCompInterval > 1000) {
            return Promise.reject(new RangeError("The magnetometer compensation interval must be in the range 100 ms - 1000 ms"));
          }
        }

        if (motionProcessFrequency !== undefined) {
          if (motionProcessFrequency < 5 || motionProcessFrequency > 200) {
            return Promise.reject(new RangeError("The motion processing unit frequency must be in the range 5 hz - 200 hz"));
          }
        }

        if (wakeOnMotion !== undefined) {
          if (typeof wakeOnMotion !== "boolean") {
            return Promise.reject(new RangeError("The argument must be true or false."));
          }
          wakeOnMotion = wakeOnMotion ? 1 : 0;
        }

        const receivedData = await this._read(true);
        const littleEndian = true;
        stepCounterInterval = stepCounterInterval || receivedData.getUint16(0, littleEndian);
        tempCompensationInterval = tempCompensationInterval || receivedData.getUint16(2, littleEndian);
        magnetCompInterval = magnetCompInterval || receivedData.getUint16(4, littleEndian);
        motionProcessFrequency = motionProcessFrequency || receivedData.getUint16(6, littleEndian);

        // Do it this way because otherwise it would evaluate a truth statement, i.e. wakeOnMotion = 0 || 1.
        // This would result in never being able to turn wakeOnMotion off once it was on.
        if (wakeOnMotion === undefined) {
          wakeOnMotion = receivedData.getUint8(8);
        }

        const dataArray = new Uint8Array(9);
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = receivedData.getUint8(i);
        }

        dataArray[0] = stepCounterInterval & 0xff;
        dataArray[1] = (stepCounterInterval >> 8) & 0xff;
        dataArray[2] = tempCompensationInterval & 0xff;
        dataArray[3] = (tempCompensationInterval >> 8) & 0xff;
        dataArray[4] = magnetCompInterval & 0xff;
        dataArray[5] = (magnetCompInterval >> 8) & 0xff;
        dataArray[6] = motionProcessFrequency & 0xff;
        dataArray[7] = (motionProcessFrequency >> 8) & 0xff;
        dataArray[8] = wakeOnMotion;

        return dataArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class SoundConfigurationService extends FeatureOperations {
    constructor(device) {
      super(device, "soundconfiguration");

      // gatt service and characteristic used to communicate with Thingy's sound service
      this.service = {
        uuid: this.device.TSS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TSS_CONFIG_UUID,
        decoder: this.decodeSoundConfigurationData.bind(this),
        encoder: this.encodeSoundConfigurationData.bind(this),
      };
    }

    decodeSoundConfigurationData(data) {
      try {
        const speakerMode = data.getUint8(0);
        const microphoneMode = data.getUint8(1);
        const decodedSoundConfiguration = {
          speakerMode: speakerMode,
          microphoneMode: microphoneMode,
        };
        return decodedSoundConfiguration;
      } catch (error) {
        throw error;
      }
    }

    async encodeSoundConfigurationData(data) {
      try {
        if (typeof data !== "object") {
          return Promise.reject(new TypeError("The argument has to be an object."));
        }

        if ((data.speakerMode === undefined) && (data.microphoneMode === undefined)) {
          return Promise.reject(new TypeError("The argument has to be an object with at least one of the properties speakerMode and microphoneMode."));
        }

        let speakerMode = data.speakerMode;
        let microphoneMode = data.microphoneMode;

        if (speakerMode !== undefined) {
          if (!(speakerMode === 1 || speakerMode === 2 || speakerMode === 3)) {
            return Promise.reject(new RangeError("The speaker mode must be one of the integers 1, 2 or 3."));
          }
        }

        if (microphoneMode !== undefined) {
          if (!(microphoneMode === 1 || microphoneMode === 2)) {
            return Promise.reject(new RangeError("The microphone mode must be one of the integers 1 or 2."));
          }
        }

        const receivedData = await this._read(true);
        speakerMode = speakerMode || receivedData.getUint8(0);
        microphoneMode = microphoneMode || receivedData.getUint8(1);

        const dataArray = new Uint8Array(2);
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = receivedData.getUint8(i);
        }

        dataArray[0] = speakerMode & 0xff;
        dataArray[1] = microphoneMode & 0xff;

        return dataArray;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class SpeakerDataService extends FeatureOperations {
    constructor(device) {
      super(device, "speakerdata");

      // gatt service and characteristic used to communicate with Thingy's speaker data
      this.service = {
        uuid: this.device.TSS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TSS_SPEAKER_DATA_UUID,
        encoder: this.encodeSpeakerData.bind(this),
      };

      this.soundconfigurationservice = new SoundConfigurationService(this);
    }

    async encodeSpeakerData(data) {
      try {
        if (data.mode === 1) {
          const dataArray = new Uint8Array(5);
          const frequency = data.frequency;
          const duration = data.duration;
          const volume = data.volume;

          dataArray[0] = frequency & 0xff;
          dataArray[1] = (frequency >> 8) & 0xff;
          dataArray[2] = duration & 0xff;
          dataArray[3] = (duration >> 8) & 0xff;
          dataArray[4] = volume & 0xff;

          return dataArray;
        } else if (data.mode === 2) {
          return data.data;
        } else if (data.mode === 3) {
          const dataArray = new Uint8Array(1);
          const sample = data.sample;

          dataArray[0] = sample & 0xff;

          return dataArray;
        }
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class SpeakerStatusService extends FeatureOperations {
    constructor(device) {
      super(device, "speakerstatus");

      // gatt service and characteristic used to communicate with Thingy's speaker status
      this.service = {
        uuid: this.device.TSS_UUID,
      };

      this.characteristic = {
        uuid: this.device.TSS_SPEAKER_STAT_UUID,
        decoder: this.decodeSpeakerStatus.bind(this),
      };
    }

    decodeSpeakerStatus(data) {
      try {
        const speakerStatus = data.getInt8(0);

        const decodedSpeakerStatus = {
          status: speakerStatus,
        };

        return decodedSpeakerStatus;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class BatteryService extends FeatureOperations {
    constructor(device) {
      super(device, "battery");

      // gatt service and characteristic used to communicate with Thingy's battery level
      this.service = {
        uuid: "battery_service",
      };

      this.characteristic = {
        uuid: "battery_level",
        decoder: this.decodeBatteryStatus.bind(this),
      };
    }

    decodeBatteryStatus(data) {
      try {
        const batteryStatus = data.getInt8(0);

        const decodedBatteryStatus = {
          status: batteryStatus,
        };

        return decodedBatteryStatus;
      } catch (error) {
        throw error;
      }
    }
  }

  /*
    Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
    All rights reserved.
    Redistribution and use in source and binary forms, with or without modification,
    are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright notice, this
       list of conditions and the following disclaimer.
    2. Redistributions in binary form, except as embedded into a Nordic
       Semiconductor ASA integrated circuit in a product or a software update for
       such product, must reproduce the above copyright notice, this list of
       conditions and the following disclaimer in the documentation and/or other
       materials provided with the distribution.
    3. Neither the name of Nordic Semiconductor ASA nor the names of its
       contributors may be used to endorse or promote products derived from this
       software without specific prior written permission.
    4. This software, with or without modification, must only be used with a
       Nordic Semiconductor ASA integrated circuit.
    5. Any software provided in binary form under this license must not be reverse
       engineered, decompiled, modified and/or disassembled.
    THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
    OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
    OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
    GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
    HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
    LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
    OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  class Thingy extends EventTarget {
    constructor(options = {logEnabled: true}) {
      super();

      this.logEnabled = options.logEnabled;
      this.connected = false;

      if (this.logEnabled) {
        console.log("I am alive!");
      }

      // TCS = Thingy Configuration Service
      this.TCS_UUID = "ef680100-9b35-4933-9b10-52ffa9740042";
      this.TCS_NAME_UUID = "ef680101-9b35-4933-9b10-52ffa9740042";
      this.TCS_ADV_PARAMS_UUID = "ef680102-9b35-4933-9b10-52ffa9740042";
      this.TCS_CONN_PARAMS_UUID = "ef680104-9b35-4933-9b10-52ffa9740042";
      this.TCS_EDDYSTONE_UUID = "ef680105-9b35-4933-9b10-52ffa9740042";
      this.TCS_CLOUD_TOKEN_UUID = "ef680106-9b35-4933-9b10-52ffa9740042";
      this.TCS_FW_VER_UUID = "ef680107-9b35-4933-9b10-52ffa9740042";
      this.TCS_MTU_REQUEST_UUID = "ef680108-9b35-4933-9b10-52ffa9740042";

      // TES = Thingy Environment Service
      this.TES_UUID = "ef680200-9b35-4933-9b10-52ffa9740042";
      this.TES_TEMP_UUID = "ef680201-9b35-4933-9b10-52ffa9740042";
      this.TES_PRESSURE_UUID = "ef680202-9b35-4933-9b10-52ffa9740042";
      this.TES_HUMIDITY_UUID = "ef680203-9b35-4933-9b10-52ffa9740042";
      this.TES_GAS_UUID = "ef680204-9b35-4933-9b10-52ffa9740042";
      this.TES_COLOR_UUID = "ef680205-9b35-4933-9b10-52ffa9740042";
      this.TES_CONFIG_UUID = "ef680206-9b35-4933-9b10-52ffa9740042";

      // TUIS = Thingy User Interface Service
      this.TUIS_UUID = "ef680300-9b35-4933-9b10-52ffa9740042";
      this.TUIS_LED_UUID = "ef680301-9b35-4933-9b10-52ffa9740042";
      this.TUIS_BTN_UUID = "ef680302-9b35-4933-9b10-52ffa9740042";
      this.TUIS_PIN_UUID = "ef680303-9b35-4933-9b10-52ffa9740042";

      // TMS = Thingy Motion Service
      this.TMS_UUID = "ef680400-9b35-4933-9b10-52ffa9740042";
      this.TMS_CONFIG_UUID = "ef680401-9b35-4933-9b10-52ffa9740042";
      this.TMS_TAP_UUID = "ef680402-9b35-4933-9b10-52ffa9740042";
      this.TMS_ORIENTATION_UUID = "ef680403-9b35-4933-9b10-52ffa9740042";
      this.TMS_QUATERNION_UUID = "ef680404-9b35-4933-9b10-52ffa9740042";
      this.TMS_STEP_UUID = "ef680405-9b35-4933-9b10-52ffa9740042";
      this.TMS_RAW_UUID = "ef680406-9b35-4933-9b10-52ffa9740042";
      this.TMS_EULER_UUID = "ef680407-9b35-4933-9b10-52ffa9740042";
      this.TMS_ROT_MATRIX_UUID = "ef680408-9b35-4933-9b10-52ffa9740042";
      this.TMS_HEADING_UUID = "ef680409-9b35-4933-9b10-52ffa9740042";
      this.TMS_GRAVITY_UUID = "ef68040a-9b35-4933-9b10-52ffa9740042";

      // TSS = Thingy Sound Service
      this.TSS_UUID = "ef680500-9b35-4933-9b10-52ffa9740042";
      this.TSS_CONFIG_UUID = "ef680501-9b35-4933-9b10-52ffa9740042";
      this.TSS_SPEAKER_DATA_UUID = "ef680502-9b35-4933-9b10-52ffa9740042";
      this.TSS_SPEAKER_STAT_UUID = "ef680503-9b35-4933-9b10-52ffa9740042";
      this.TSS_MIC_UUID = "ef680504-9b35-4933-9b10-52ffa9740042";

      this.serviceUUIDs = [
        "battery_service",
        this.TCS_UUID,
        this.TES_UUID,
        this.TUIS_UUID,
        this.TMS_UUID,
        this.TSS_UUID,
      ];

      this.addEventListener("gattavailable", this.executeQueuedOperations.bind(this));
      this.addEventListener("operationqueued", this.executeQueuedOperations.bind(this));

      this.advertisingparameters = new AdvertisingParametersService(this);
      this.microphone = new Microphone(this);
      this.mtu = new MTUService(this);
      this.name = new NameService(this);
      this.temperature = new TemperatureSensor(this);
      this.pressure = new PressureSensor(this);
      this.led = new LEDService(this);
      this.tap = new TapSensor(this);
      this.absoluteorientation = new AbsoluteOrientationSensor(this);
      this.quaternionorientation = new QuaternionOrientationSensor(this);
      this.button = new ButtonSensor(this);
      this.cloudtoken = new CloudTokenService(this);
      this.color = new ColorSensor(this);
      this.connectionparameters = new ConnectionParametersService(this);
      this.eddystone = new EddystoneUrlService(this);
      this.firmware = new FirmwareService(this);
      this.gas = new GasSensor(this);
      this.gravityvector = new GravityVectorSensor(this);
      this.humidity = new HumiditySensor(this);
      this.stepcounter = new StepCounterSensor(this);
      this.rawdata = new RawDataSensor(this);
      this.eulerorientation = new EulerOrientationSensor(this);
      this.rotationmatrixorientation = new RotationMatrixOrientationSensor(this);
      this.heading = new HeadingSensor(this);
      this.environmentconfiguration = new EnvironmentConfigurationService(this);
      this.motionconfiguration = new MotionConfigurationService(this);
      this.soundconfiguration = new SoundConfigurationService(this);
      this.speakerdata = new SpeakerDataService(this);
      this.speakerstatus = new SpeakerStatusService(this);
      this.battery = new BatteryService(this);
    }

    async connect() {
      try {
        // Scan for Thingys
        if (this.logEnabled) {
          console.log(`Scanning for devices with service UUID equal to ${this.TCS_UUID}`);
        }

        this.device = await navigator.bluetooth.requestDevice({
          filters: [{
            services: [this.TCS_UUID],
          }],
          optionalServices: this.serviceUUIDs,
        });

        this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

        this.setConnected(true);

        if (this.logEnabled) {
          console.log(`Found Thingy named "${this.device.name}", trying to connect`);
        }

        // Connect to GATT server
        this.server = await this.device.gatt.connect();

        this.thingyController = new ThingyController(this);
        this.utilities = new Utilities(this);

        if (this.logEnabled) {
          console.log(`Connected to "${this.device.name}"`);
        }

        return true;
      } catch (error) {
        this.setConnected(false);

        if ("utilities" in this) {
          this.utilities.processEvent("error", "thingy", error);
        }

        return false;
      }
    }

    // used to execute queued operations.
    // as long as this method perceives operations to be executed (without regard to the operation's outcome) it will run.
    // if an operation fails three times and seemingly no other operations are executed at the same time, the operation is discarded.
    async executeQueuedOperations() {
      try {
        if (!this.thingyController.getExecutingQueuedOperations()) {
          if (this.thingyController.getNumQueuedOperations() !== 0) {
            if (this.thingyController.getGattStatus()) {
              this.thingyController.setExecutingQueuedOperations(true);
              
              const triedOperations = {};
              let operation;
        
              let totalOperationsExecutedUntilLastIteration = 0;
              let totalOperationsExecutedSinceLastIteration = 0;

              while (this.thingyController.getNumQueuedOperations() !== 0) {
                if (!this.getConnected()) {
                  break;
                }
        
                totalOperationsExecutedSinceLastIteration = this.thingyController.getNumExecutedOperations() - totalOperationsExecutedUntilLastIteration;
                totalOperationsExecutedUntilLastIteration = this.thingyController.getNumExecutedOperations();
                operation = this.thingyController.dequeue();
                
                if (!(operation.feature in triedOperations)) {
                  triedOperations[operation.feature] = {};
                }
        
                if (!(operation.method in triedOperations[operation.feature])) {
                  triedOperations[operation.feature][operation.method] = 0;
                } 
        
                triedOperations[operation.feature][operation.method]++;
                
                const successful = await operation.f();

                // this condition will hopefully never be met
                if (triedOperations[operation.feature][operation.method] === 10 && successful !== true) {
                  this.thingyController.removeQueuedOperation(operation);
                  this.utilities.processEvent("operationdiscarded", "thingy", operation);
                }
        
                if (triedOperations[operation.feature][operation.method] >= 3) {
                  if (successful !== true) {
                    if (totalOperationsExecutedSinceLastIteration < 2) {
                      if (totalOperationsExecutedSinceLastIteration === 1) {
                        const op = this.thingyController.getExecutedOperation(this.thingyController.getNumExecutedOperations() - 1);

                        if (op.feature !== operation.feature || op.method !== operation.method) {
                          continue;
                        }
                      }

                      // we have now tried this particular operation three times.
                      // It's still not completing successfully, and no other operations
                      // are going through. We are therefore discarding it.
                      this.thingyController.removeQueuedOperation(operation);
                      this.utilities.processEvent("operationdiscarded", "thingy", operation);
                    }
                  }
                }
              } 
        
              this.thingyController.setExecutingQueuedOperations(false);
            }
          }
        }
      } catch (error) {
        this.thingyController.setExecutingQueuedOperations(false);
        this.utilities.processEvent("error", "thingy", error);
      }
    }

    getConnected() {
      return this.connected;
    }

    setConnected(bool) {
      this.connected = bool;
    }

    resetDeviceProperties() {
      this.setConnected(false);
      this.thingyController.terminate();
    }

    onDisconnected({target}) {
      if (!this.getConnected()) {
        if (this.logEnabled) {
          console.log(`Disconnected from device named ${target.name}`);
        }
      } else {
        this.resetDeviceProperties();
        this.utilities.processEvent("disconnected", "thingy");
      }
    }

    async disconnect() {
      try {
        this.resetDeviceProperties();
        await this.device.gatt.disconnect();
        return true;
      } catch (error) {
        this.utilities.processEvent("error", "thingy", error);
        return false;
      }
    }
  }

  return Thingy;

}());
