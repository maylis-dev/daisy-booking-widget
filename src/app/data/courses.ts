export const studio = {
	id: "std_2201",
	name: "Atelier Terre & Feu",
	timezone: "Europe/Paris",
	currency: "EUR",

	branding: {
		primaryColor: "#7953A3",
		fontFamily: "Arial",
		availableFonts: ["Arial", "Georgia", "Courier New"],
		logoUrl: "https://cdn.daisy.example/logos/std_2201.png",
	},

	bookingPolicy: {
		requiresPhone: true,
		cancellationHours: 48,
		maxSeatsPerBooking: 4,
	},
};

export const courses = [
	{
		id: "cours-1",
		name: "Initiation à la céramique",
		description: "Découvrez les bases du modelage de l'argile.",
		durationMinutes: 120,
		priceCents: 4500,

		fontFamily: "font-serif",
		textColor: "text-[#A45135]",
		selectionColor: "border-[#A45135]",
		reservationBg: "rgba(164, 81, 53, 0.1)",
		reservationText: "#A45135",

		slots: [
			{
				id: "slot-1",
				startsAt: "2026-10-24T10:00:00+02:00",
				seatsAvailable: 4,
				priceCents: 4500,
			},
			{
				id: "slot-2",
				startsAt: "2026-10-25T14:00:00+02:00",
				seatsAvailable: 1,
				priceCents: 5000,
			},
		],
	},

	{
		id: "cours-2",
		name: "Peinture à l'aquarelle",
		description: "Apprenez à créer vos premières œuvres à l'aquarelle.",
		durationMinutes: 90,
		priceCents: 3000,

		fontFamily: "font-sans italic",
		textColor: "text-[#7953A3]",
		selectionColor: "border-[#7953A3]",
		reservationBg: "rgba(121, 83, 163, 0.1)",
		reservationText: "#7953A3",
		slots: [
			{
				id: "slot-3",
				startsAt: "2026-10-26T14:00:00+02:00",
				seatsAvailable: 6,
				priceCents: 3000,
			},
			{
				id: "slot-4",
				startsAt: "2026-10-28T10:00:00+02:00",
				seatsAvailable: 0,
				priceCents: 3500,
			},
		],
	},

	{
		id: "cours-3",
		name: "Création de bougies",
		description: "Fabriquez vos propres bougies parfumées.",
		durationMinutes: 60,
		priceCents: 2500,

		fontFamily: "font-mono",
		textColor: "text-[#B34F79]",
		selectionColor: "border-[#B34F79]",
		reservationBg: "rgba(179, 79, 121, 0.1)",
		reservationText: "#B34F79",

		slots: [
			{
				id: "slot-5",
				startsAt: "2026-10-29T15:00:00+02:00",
				seatsAvailable: 5,
				priceCents: 2500,
			},
		],
	},
];
