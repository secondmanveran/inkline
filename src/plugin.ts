/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectionKey, Plugin, reactive, watch } from "vue";
import { addClass, isKey, removeClass } from "@grozav/utils";
import { initialize as initializeForm } from "@inkline/inkline/validation";
import { setLocale } from "@inkline/inkline/i18n";
import * as inklineIcons from "@inkline/inkline/icons";
import { SvgNode } from "@inkline/inkline/types";
import { OverlayController } from "./controllers";

export interface PrototypeConfig {
    colorMode: "system" | "light" | "dark" | string;
    locale: string;
    validateOn: string[];
    routerComponent: string;
    color: string;
    size: string;
    componentOptions: any;

    [key: string]: any;
}

export interface PluginConfig extends PrototypeConfig {
    components: any;
    icons: Record<string, SvgNode>;
}

export interface InklineGlobalOptions {
    form: (...args: any[]) => any;
    setLocale: (language: string) => any;
    options: PrototypeConfig;
}

export interface InklineGlobals {
    prototype?: InklineGlobalOptions;
    icons?: Record<string, SvgNode>;
}

/**
 * Color mode localStorage key
 */
export const colorModeLocalStorageKey = "inkline-color-mode";

/**
 * Color mode change handler
 */
export const handleColorMode = (colorMode: string) => {
    let color;
    if (colorMode === "system") {
        color = matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    } else {
        color = colorMode;
    }

    removeClass(document.body, "light-theme dark-theme");
    addClass(document.body, `${color}-theme`);
};

/**
 * Default configuration options
 */
export const defaultOptions: PluginConfig = {
    components: {},
    icons: {},
    colorMode: "system",
    locale: "en",
    validateOn: ["input", "blur"],
    color: "",
    size: "",
    routerComponent: "router-link",
    componentOptions: {},
};

/**
 * Create inkline prototype
 */
export function createPrototype({
    icons,
    components,
    ...options
}: PrototypeConfig): InklineGlobalOptions {
    return {
        form(schema) {
            return initializeForm(schema);
        },
        setLocale(locale) {
            setLocale(locale);
        },
        options: reactive(options),
    } as InklineGlobalOptions;
}

/**
 * Easily accessible global Inkline object
 */
export const inklineGlobals: InklineGlobals = {
    prototype: undefined,
    icons: undefined,
};

export const InklineKey = Symbol(
    "inkline"
) as InjectionKey<InklineGlobalOptions>;
export const InklineIconsKey = Symbol("inklineIcons") as InjectionKey<
    Record<string, SvgNode>
>;

/**
 * Inkline Vue.js plugin
 */
export const Inkline: Plugin = {
    install(app, options: Partial<PrototypeConfig> = {}) {
        const extendedOptions: PluginConfig = {
            ...defaultOptions,
            ...options,
        };

        /**
         * Register components provided through options globally
         */

        for (const componentIndex in extendedOptions.components) {
            app.component(
                componentIndex,
                extendedOptions.components[componentIndex]
            );
        }

        /**
         * Get preferred theme based on selected color mode
         */

        if (typeof window !== "undefined") {
            const storedColorMode = localStorage.getItem(
                colorModeLocalStorageKey
            );
            if (storedColorMode) {
                extendedOptions.colorMode = storedColorMode;
            }
        }

        /**
         * Add $inkline global property
         */

        const prototype: InklineGlobalOptions =
            createPrototype(extendedOptions);

        inklineGlobals.prototype = prototype;
        app.config.globalProperties.$inkline = prototype;
        app.provide(InklineKey, prototype);

        /**
         * Add inklineIcons global provide
         */

        const icons: Record<string, SvgNode> = {
            ...inklineIcons,
            ...extendedOptions.icons,
        };

        app.provide(InklineIconsKey, icons);

        if (typeof window !== "undefined") {
            /**
             * Add global key bindings
             */

            window.addEventListener("keydown", (e) => {
                if (isKey("esc", e)) {
                    /**
                     * Handle `esc` key when a modal is shown
                     */
                    OverlayController.onPressEscape();
                }
            });

            /**
             * Add color mode on change handler
             */

            watch(
                () => prototype.options.colorMode,
                (colorMode) => {
                    handleColorMode(colorMode as string);

                    localStorage.setItem(
                        colorModeLocalStorageKey,
                        colorMode as string
                    );
                }
            );

            /**
             * Add dark mode media query on change handler
             */

            const onDarkModeMediaQueryChange = () => {
                if (prototype.options.colorMode === "system") {
                    handleColorMode(prototype.options.colorMode);
                }
            };

            const darkModeMediaQuery: MediaQueryList = matchMedia(
                "(prefers-color-scheme: dark)"
            );
            if (darkModeMediaQuery.addEventListener) {
                darkModeMediaQuery.addEventListener(
                    "change",
                    onDarkModeMediaQueryChange
                );
            } else {
                darkModeMediaQuery.addListener(onDarkModeMediaQueryChange);
            }

            /**
             * Add inkline class to document body and initialize color mode
             */

            addClass(document.body, "inkline");
            handleColorMode(extendedOptions.colorMode);
        }
    },
};

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $inkline: InklineGlobalOptions;
    }
}
