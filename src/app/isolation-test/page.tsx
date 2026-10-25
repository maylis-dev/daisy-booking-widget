import ShadowTest from "../shadow-test";
import WidgetShadow from "../widget-shadow";

export default function IsolationTestPage() {
	return (
		<main
			style={{
				minHeight: "100vh",
				padding: "30px",
				background: "#fff0f0",
				color: "red",
				fontFamily: "Georgia, serif",
			}}>
			<style>{`
        button {
          background: red !important;
          color: yellow !important;
          border-radius: 0 !important;
          font-size: 24px !important;
        }

        input, select, textarea {
          background: pink !important;
          color: red !important;
          border: 4px solid red !important;
          font-family: Georgia, serif !important;
        }

        * {
          letter-spacing: 2px !important;
        }
      `}</style>

			<h1>Site de test de l’artisan</h1>
			<p>
				Cette page impose volontairement des styles CSS agressifs. Le widget
				Daisy devrait conserver son apparence à l’intérieur du Shadow DOM.
			</p>

			<section
				style={{
					maxWidth: "800px",
					margin: "30px auto",
					padding: "24px",
					background: "white",
					border: "3px dashed red",
				}}>
				<WidgetShadow>
					<ShadowTest />
				</WidgetShadow>
			</section>
		</main>
	);
}
