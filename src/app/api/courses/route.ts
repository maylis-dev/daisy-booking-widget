import { courses } from "../../data/courses";

export async function GET() {
	return Response.json({
		courses: courses.map((course) => ({
			course_id: course.id,
			name: course.name,
			description: course.description,
			duration_minutes: course.durationMinutes,
			price_cents: course.priceCents,
		})),
	});
}
