import { studio } from "../../data/courses";

export async function GET() {
	return Response.json({
		studio_id: studio.id,
		name: studio.name,
		timezone: studio.timezone,
		currency: studio.currency,
		branding: {
			primary_color: studio.branding.primaryColor,
			logo_url: studio.branding.logoUrl,
		},
		booking_policy: {
			requires_phone: studio.bookingPolicy.requiresPhone,
			cancellation_hours: studio.bookingPolicy.cancellationHours,
			max_seats_per_booking: studio.bookingPolicy.maxSeatsPerBooking,
		},
	});
}
