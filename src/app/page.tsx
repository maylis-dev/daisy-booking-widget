import ShadowTest from "./shadow-test";
import WidgetShadow from "../app/widget-shadow";

export default function Home() {
	return (
		<main className="min-h-screen bg-stone-100 p-6 sm:p-10">
			<div className="mx-auto max-w-3xl">
				<h1 className="mb-2 text-2xl font-bold text-stone-800">
					Daisy — laboratoire du widget
				</h1>

				<p className="mb-8 text-stone-600">
					Nous testons l’isolation du widget avant de créer le parcours de
					réservation.
				</p>

				<WidgetShadow>
					<ShadowTest />
				</WidgetShadow>
			</div>
		</main>
	);
}
