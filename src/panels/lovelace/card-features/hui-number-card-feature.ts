import { HassEntity } from "home-assistant-js-websocket";
import { css, html, LitElement, nothing, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators";
import { computeDomain } from "../../../common/entity/compute_domain";
import { isUnavailableState } from "../../../data/entity";
import { HomeAssistant } from "../../../types";
import { LovelaceCardFeature, LovelaceCardFeatureEditor } from "../types";
import { NumberCardFeatureConfig } from "./types";
import "../../../components/ha-control-button";
import "../../../components/ha-control-button-group";
import "../../../components/ha-control-number-buttons";
import "../../../components/ha-control-slider";
import "../../../components/ha-icon";

export const supportsNumberCardFeature = (stateObj: HassEntity) => {
  const domain = computeDomain(stateObj.entity_id);
  return domain === "input_number" || domain === "number";
};

@customElement("hui-number-card-feature")
class HuiNumberCardFeature extends LitElement implements LovelaceCardFeature {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ attribute: false }) public stateObj?: HassEntity;

  @state() private _config?: NumberCardFeatureConfig;

  @state() _currentState?: string;

  static getStubConfig(): NumberCardFeatureConfig {
    return {
      type: "number",
      style: "buttons",
    };
  }

  public static async getConfigElement(): Promise<LovelaceCardFeatureEditor> {
    await import("../editor/config-elements/hui-number-card-feature-editor");
    return document.createElement("hui-number-card-feature-editor");
  }

  public setConfig(config: NumberCardFeatureConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = config;
  }

  protected willUpdate(changedProp: PropertyValues): void {
    super.willUpdate(changedProp);
    if (changedProp.has("stateObj") && this.stateObj) {
      this._currentState = this.stateObj.state;
    }
  }

  private async _setValue(ev: CustomEvent) {
    const stateObj = this.stateObj!;

    const domain = computeDomain(stateObj.entity_id);

    await this.hass!.callService(domain, "set_value", {
      entity_id: stateObj.entity_id,
      value: ev.detail.value,
    });
  }

  protected render() {
    if (
      !this._config ||
      !this.hass ||
      !this.stateObj ||
      !supportsNumberCardFeature(this.stateObj)
    ) {
      return nothing;
    }

    const stateObj = this.stateObj;

    return html`
      <div class="container">
        ${this._config.style === "buttons"
          ? html`<ha-control-number-buttons
              value=${stateObj.state}
              min=${stateObj.attributes.min}
              max=${stateObj.attributes.max}
              step=${stateObj.attributes.step}
              @value-changed=${this._setValue}
              .disabled=${isUnavailableState(stateObj.state)}
              .unit=${stateObj.attributes.unit_of_measurement}
              .locale=${this.hass.locale}
            ></ha-control-number-buttons>`
          : html`<ha-control-slider
              value=${stateObj.state}
              min=${stateObj.attributes.min}
              max=${stateObj.attributes.max}
              step=${stateObj.attributes.step}
              @value-changed=${this._setValue}
              .disabled=${isUnavailableState(stateObj.state)}
              .unit=${stateObj.attributes.unit_of_measurement}
              .locale=${this.hass.locale}
            ></ha-control-slider>`}
      </div>
    `;
  }

  static get styles() {
    return css`
      ha-control-number-buttons {
        width: auto;
      }
      ha-control-slider {
        --control-slider-color: var(--feature-color);
      }
      .container {
        padding: 0 12px 12px 12px;
        width: auto;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-number-card-feature": HuiNumberCardFeature;
  }
}
