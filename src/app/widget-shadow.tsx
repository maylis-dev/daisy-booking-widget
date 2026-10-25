"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type WidgetShadowProps = {
	children: ReactNode;
};

export default function WidgetShadow({ children }: WidgetShadowProps) {
	const hostRef = useRef<HTMLDivElement>(null);
	const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);
	const [stylesLoaded, setStylesLoaded] = useState(false);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

		let stylesheet = shadow.querySelector<HTMLLinkElement>(
			"link[data-daisy-styles]",
		);

		if (!stylesheet) {
			stylesheet = document.createElement("link");
			stylesheet.rel = "stylesheet";
			stylesheet.href = "/daisy-widget.css";
			stylesheet.setAttribute("data-daisy-styles", "");
			shadow.appendChild(stylesheet);
		}

		let mount = shadow.querySelector<HTMLDivElement>("[data-daisy-mount]");

		if (!mount) {
			const style = document.createElement("style");

			style.textContent = `
        :host {
          display: block;
          font-family: Arial, Helvetica, sans-serif;
          color: #332b3a;
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        button, input, select, textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
        }

        img, svg {
          max-width: 100%;
        }
      `;

			shadow.appendChild(style);

			mount = document.createElement("div");
			mount.setAttribute("data-daisy-mount", "");
			shadow.appendChild(mount);
		}

		let cancelled = false;

		const showContent = () => {
			if (cancelled) return;
			setMountNode(mount);
			setStylesLoaded(true);
		};

		if (stylesheet.sheet) {
			showContent();
		} else {
			stylesheet.addEventListener("load", showContent, { once: true });
			stylesheet.addEventListener(
				"error",
				() => {
					// Évite de bloquer le widget si le CSS échoue.
					showContent();
				},
				{ once: true },
			);
		}

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div
			ref={hostRef}
			style={{ minWidth: 0 }}>
			{stylesLoaded && mountNode ? createPortal(children, mountNode) : null}
		</div>
	);
}
