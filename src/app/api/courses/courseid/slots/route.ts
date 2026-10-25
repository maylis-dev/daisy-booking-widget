import { courses } from "../../../../data/courses";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const courseId = searchParams.get("course_id");
	const from = searchParams.get("from");
	const to = searchParams.get("to");

	if (!courseId) {
		return Response.json({ error: "course_id_required" }, { status: 400 });
	}

	if (!from || !to) {
		return Response.json({ error: "from_and_to_required" }, { status: 400 });
	}

	const fromDate = new Date(from);
	const toDate = new Date(to);

	if (
		Number.isNaN(fromDate.getTime()) ||
		Number.isNaN(toDate.getTime()) ||
		toDate < fromDate
	) {
		return Response.json({ error: "invalid_date_range" }, { status: 400 });
	}

	const maxDays = 90 * 24 * 60 * 60 * 1000;

	if (toDate.getTime() - fromDate.getTime() > maxDays) {
		return Response.json({ error: "date_range_too_large" }, { status: 400 });
	}

	const course = courses.find((item) => item.id === courseId);

	if (!course) {
		return Response.json({ error: "course_not_found" }, { status: 404 });
	}

	const slots = course.slots
		.filter((slot) => {
			const date = new Date(slot.startsAt);
			return date >= fromDate && date <= toDate;
		})
		.map((slot) => ({
			slot_id: slot.id,
			starts_at: slot.startsAt,
			seats_available: slot.seatsAvailable,
			price_cents: slot.priceCents,
		}));

	return Response.json({ slots });
}
