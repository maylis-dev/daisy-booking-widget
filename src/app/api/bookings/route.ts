import { courses, studio } from "../../data/courses";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

const allowedOrigins = (
	process.env.BOOKING_ALLOWED_ORIGINS ?? "http://localhost:3000"
)
	.split(",")
	.map((value) => value.trim())
	.filter(Boolean);

export async function POST(request: Request) {
	const origin = request.headers.get("origin");

	if (!origin || !allowedOrigins.includes(origin)) {
		return Response.json({ error: "origin_not_allowed" }, { status: 403 });
	}

	const forwardedFor = request.headers.get("x-forwarded-for");
	const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
	const now = Date.now();

	let entry = rateLimitStore.get(ip);

	if (!entry || now >= entry.resetAt) {
		entry = {
			count: 0,
			resetAt: now + WINDOW_MS,
		};

		rateLimitStore.set(ip, entry);
	}

	entry.count += 1;

	if (entry.count > RATE_LIMIT) {
		return Response.json(
			{ error: "rate_limited" },
			{
				status: 429,
				headers: {
					"Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
				},
			},
		);
	}

	await new Promise((resolve) => setTimeout(resolve, 1500));

	let body;

	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_json" }, { status: 400 });
	}

	const { slot_id, seats, customer } = body;

	if (slot_id === "slot-cancelled-test") {
		return Response.json({ error: "slot_cancelled" }, { status: 409 });
	}

	if (!slot_id || !Number.isInteger(seats) || seats < 1) {
		return Response.json({ error: "invalid_booking_details" }, { status: 400 });
	}

	if (
		!customer?.first_name?.trim() ||
		!customer?.last_name?.trim() ||
		!customer?.email?.trim()
	) {
		return Response.json(
			{ error: "customer_details_required" },
			{ status: 422 },
		);
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
		return Response.json({ error: "invalid_email" }, { status: 422 });
	}

	if (studio.bookingPolicy.requiresPhone && !customer.phone?.trim()) {
		return Response.json({ error: "phone_required" }, { status: 422 });
	}

	if (seats > studio.bookingPolicy.maxSeatsPerBooking) {
		return Response.json({ error: "too_many_seats" }, { status: 422 });
	}

	const course = courses.find((course) =>
		course.slots.some((slot) => slot.id === slot_id),
	);

	const slot = course?.slots.find((slot) => slot.id === slot_id);

	if (!slot) {
		return Response.json({ error: "slot_not_found" }, { status: 404 });
	}

	if (slot.seatsAvailable < seats) {
		return Response.json(
			{
				error: "slot_full",
				available: slot.seatsAvailable,
			},
			{ status: 409 },
		);
	}

	slot.seatsAvailable -= seats;

	return Response.json(
		{
			booking_id: `booking_${Date.now()}`,
			status: "confirmed",
			confirmation_code: `DEMO-${Date.now().toString().slice(-6)}`,
			total_cents: slot.priceCents * seats,
		},
		{ status: 201 },
	);
}
