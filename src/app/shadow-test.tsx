"use client";

import { useEffect, useState, type FormEvent } from "react";

import { courses, studio } from "./data/courses";

const primaryColor = studio.branding.primaryColor;
const availableFonts = studio.branding.availableFonts;

const DAY_MS = 24 * 60 * 60 * 1000;

type TestMode =
	| "success"
	| "full"
	| "cancelled"
	| "phone_required"
	| "too_many_seats"
	| "rate_limited"
	| "origin_not_allowed"
	| "network";

const inputClass =
	"mt-2 w-full rounded-xl border border-[#eaddeb] bg-white px-4 py-3 text-sm text-[#493650] outline-none transition placeholder:text-[#b3a3b8] focus:border-[#9570b7] focus:ring-2 focus:ring-[#eadcf5]";

const primaryButtonClass =
	"w-full rounded-xl px-5 py-3.5 font-semibold text-white shadow-sm transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50";

const buttonStyle = {
	backgroundColor: primaryColor,
};

export default function ShadowTest() {
	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [selectedCourseId, setSelectedCourseId] = useState("");
	const [selectedSlotId, setSelectedSlotId] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [requiresPhone, setRequiresPhone] = useState(false);
	const [seats, setSeats] = useState(1);
	const [confirmationCode, setConfirmationCode] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [testMode, setTestMode] = useState<TestMode>("success");
	const [now, setNow] = useState<number | null>(null);
	const [selectedFont, setSelectedFont] = useState(studio.branding.fontFamily);

	useEffect(() => {
		setNow(Date.now());
	}, []);

	const selectedCourse = courses.find(
		(course) => course.id === selectedCourseId,
	);
	const reservationTextStyle = selectedCourse
		? { color: selectedCourse.reservationText }
		: {};

	const futureSlots =
		now === null
			? []
			: (selectedCourse?.slots.filter((slot) => {
					const date = new Date(slot.startsAt).getTime();
					return date >= now && date <= now + 90 * DAY_MS;
				}) ?? []);

	const slotsIn30Days = futureSlots.filter(
		(slot) =>
			now !== null && new Date(slot.startsAt).getTime() <= now + 30 * DAY_MS,
	);

	const slotsIn60Days = futureSlots.filter(
		(slot) =>
			now !== null && new Date(slot.startsAt).getTime() <= now + 60 * DAY_MS,
	);

	let availableSlots = slotsIn30Days;
	let searchPeriod = 30;

	if (slotsIn30Days.length === 0 && slotsIn60Days.length > 0) {
		availableSlots = slotsIn60Days;
		searchPeriod = 60;
	} else if (slotsIn60Days.length === 0 && futureSlots.length > 0) {
		availableSlots = futureSlots;
		searchPeriod = 90;
	}

	const selectedSlot = selectedCourse?.slots.find(
		(slot) => slot.id === selectedSlotId,
	);

	function handleCourseChange(courseId: string) {
		setSelectedCourseId(courseId);
		setSelectedSlotId("");
		setSeats(1);
		setErrorMessage("");
		setConfirmationCode("");
	}

	function handleSlotChange(slotId: string) {
		setSelectedSlotId(slotId);
		setSeats(1);
		setErrorMessage("");
	}

	function goToDetails() {
		if (!selectedCourse) {
			setErrorMessage("Choisissez un atelier pour continuer.");
			return;
		}

		setErrorMessage("");
		setStep(2);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (isSubmitting) return;

		setErrorMessage("");

		if (!selectedCourse || !selectedSlot) {
			setErrorMessage("Choisissez un atelier et une date.");
			return;
		}

		if (new Date(selectedSlot.startsAt).getTime() < Date.now()) {
			setErrorMessage("Cette date est passée. Choisissez un autre créneau.");
			return;
		}

		if (!firstName.trim() || !lastName.trim() || !email.trim()) {
			setErrorMessage("Veuillez remplir tous les champs obligatoires.");
			return;
		}

		if (requiresPhone && !phone.trim()) {
			setErrorMessage("Un numéro de téléphone est obligatoire.");
			return;
		}

		setIsSubmitting(true);

		try {
			if (!navigator.onLine || testMode === "network") {
				setErrorMessage(
					"Impossible de contacter le service de réservation. Vérifiez votre connexion puis réessayez.",
				);
				return;
			}

			if (testMode !== "success") {
				const messages: Record<Exclude<TestMode, "success">, string> = {
					full: "Ce créneau vient peut-être d'être réservé. Choisissez un autre horaire.",
					cancelled:
						"L'artisan a annulé ce créneau. Choisissez une autre date.",
					phone_required: "Un numéro de téléphone est obligatoire.",
					too_many_seats:
						"Le nombre de places demandé dépasse la limite autorisée.",
					rate_limited:
						"Trop de demandes ont été envoyées. Veuillez patienter.",
					origin_not_allowed: "Ce widget n'est pas autorisé sur ce site.",
					network: "Impossible de contacter le service de réservation.",
				};

				setErrorMessage(messages[testMode]);
				return;
			}

			const response = await fetch("/api/bookings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					slot_id: selectedSlot.id,
					seats,
					customer: {
						first_name: firstName.trim(),
						last_name: lastName.trim(),
						email: email.trim(),
						phone: phone.trim(),
					},
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				if (response.status === 409 && result.error === "slot_full") {
					setErrorMessage(
						"Ce créneau n'est malheureusement plus disponible. Choisissez une autre date.",
					);
					setSelectedSlotId("");
				} else if (result.error === "phone_required") {
					setErrorMessage("Un numéro de téléphone est obligatoire.");
				} else if (result.error === "too_many_seats") {
					setErrorMessage(
						"Le nombre de places demandé dépasse la limite autorisée.",
					);
				} else if (result.error === "slot_cancelled") {
					setErrorMessage(
						"L'artisan a annulé ce créneau. Choisissez une autre date.",
					);
					setSelectedSlotId("");
				} else if (result.error === "rate_limited") {
					setErrorMessage(
						"Trop de demandes ont été envoyées. Veuillez patienter.",
					);
				} else if (result.error === "origin_not_allowed") {
					setErrorMessage("Ce widget n'est pas autorisé sur ce site.");
				} else {
					setErrorMessage(
						"La réservation a échoué. Vérifiez vos informations et réessayez.",
					);
				}

				return;
			}

			setConfirmationCode(result.confirmation_code);
			setStep(3);
		} catch {
			setErrorMessage(
				"Impossible de contacter le service de réservation. Vérifiez votre connexion puis réessayez.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	function resetForm() {
		setStep(1);
		setSelectedCourseId("");
		setSelectedSlotId("");
		setFirstName("");
		setLastName("");
		setEmail("");
		setPhone("");
		setRequiresPhone(false);
		setSeats(1);
		setConfirmationCode("");
		setErrorMessage("");
		setTestMode("success");
	}

	const formattedDate = selectedSlot
		? new Date(selectedSlot.startsAt).toLocaleString("fr-FR", {
				dateStyle: "full",
				timeStyle: "short",
				timeZone: "Europe/Paris",
			})
		: "";

	return (
		<main
			style={{ "--daisy-primary": primaryColor } as React.CSSProperties}
			className="mx-auto w-full max-w-2xl px-3 py-6 sm:px-5 sm:py-10">
			<div className="overflow-hidden rounded-[28px] border border-[#f0e3f0] bg-[#fffdfd] shadow-[0_18px_60px_rgba(95,61,113,0.12)]">
				{/* En-tête Daisy */}
				<header className="bg-gradient-to-br from-[#f4e8f7] via-[#f8e9f1] to-[#fceef0] px-6 py-7 sm:px-9 sm:py-9">
					<div className="mb-5 flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
							✿
						</div>
						<div>
							<p className="text-sm font-bold tracking-[0.18em] text-[#7953a3]">
								DAISY
							</p>
							<p className="text-xs text-[#8d7794]">Des ateliers à partager</p>
						</div>
					</div>

					<h1 className="text-2xl font-bold tracking-tight text-[#493650] sm:text-3xl">
						{step === 1
							? "Quel atelier vous fait envie ?"
							: step === 2
								? "Votre réservation"
								: "C'est presque fleuri !"}
					</h1>

					<p className="mt-2 max-w-lg text-sm leading-6 text-[#806d87]">
						{step === 1
							? "Découvrez nos expériences créatives et choisissez votre prochain moment pour vous."
							: step === 2
								? "Choisissez votre créneau et renseignez vos coordonnées pour continuer."
								: "Retrouvez les détails de votre demande juste ici."}
					</p>

					{/* Progression */}
					{step !== 3 && (
						<div className="mt-7">
							<div className="mb-2 flex justify-between text-xs font-medium text-[#806d87]">
								<span>Étape {step} sur 2</span>
								<span>
									{step === 1 ? "Choix de l'atelier" : "Vos informations"}
								</span>
							</div>
							<div className="h-2 overflow-hidden rounded-full bg-white/80">
								<div
									className={`h-full rounded-full bg-[#956fba] transition-all duration-300 ${
										step === 1 ? "w-1/2" : "w-full"
									}`}
								/>
							</div>
						</div>
					)}
				</header>

				<div className="px-5 py-6 sm:px-9 sm:py-8">
					{step === 1 && (
						<section>
							<div className="mb-5 flex items-center justify-between">
								<h2 className="font-semibold text-[#493650]">Les ateliers</h2>
								<span className="text-xs text-[#9b879f]">
									{courses.length} expérience(s)
								</span>
							</div>

							<div className="space-y-3">
								{courses.map((course, index) => {
									const isSelected = selectedCourseId === course.id;

									return (
										<button
											key={course.id}
											type="button"
											onClick={() => handleCourseChange(course.id)}
											aria-pressed={isSelected}
											className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
												isSelected
													? `${course.selectionColor} bg-white`
													: "border-[#eee4ef] bg-white hover:border-[#d5bde2] hover:bg-[#fdf9fe]"
											}`}>
											<div
												className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
													index % 3 === 0
														? "bg-[#f5e7f6]"
														: index % 3 === 1
															? "bg-[#fce9ed]"
															: "bg-[#f8efd9]"
												}`}>
												{index % 3 === 0 ? "🌷" : index % 3 === 1 ? "🎨" : "🌼"}
											</div>

											<div className="min-w-0 flex-1">
												<div className="flex items-start justify-between gap-3">
													<h3
														className={`font-semibold ${course.fontFamily} ${course.textColor}`}>
														{course.name}
													</h3>

													<span
														className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
															isSelected
																? "border-[#7953a3] bg-[#7953a3] text-white"
																: "border-[#d9cbdc] bg-white"
														}`}>
														{isSelected ? "✓" : ""}
													</span>
												</div>

												<p className="mt-1 line-clamp-2 text-sm leading-5 text-[#88768e]">
													{course.description ||
														"Un moment créatif à découvrir."}
												</p>

												<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#806d87]">
													<span>◷ {course.durationMinutes} min</span>
													<span className={`font-semibold ${course.textColor}`}>
														{(course.priceCents / 100).toFixed(2)} € / personne
													</span>
												</div>
											</div>
										</button>
									);
								})}
							</div>

							{errorMessage && (
								<p
									role="alert"
									className="mt-4 rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a33e58]">
									{errorMessage}
								</p>
							)}

							<button
								type="button"
								onClick={goToDetails}
								disabled={!selectedCourse}
								style={buttonStyle}
								className={`${primaryButtonClass} mt-6`}>
								Choisir la date
								<span
									className="ml-2"
									aria-hidden="true">
									→
								</span>
							</button>
						</section>
					)}

					{step === 2 && selectedCourse && (
						<form
							onSubmit={handleSubmit}
							style={{
								backgroundColor: selectedCourse.reservationBg,
								color: selectedCourse.reservationText,
							}}
							className="space-y-7 rounded-2xl p-4 sm:p-6">
							<div className="flex items-center gap-3 rounded-2xl border border-[#eee1f0] bg-white p-4">
								<div
									className={`flex items-center gap-3 rounded-2xl border bg-white p-4 ${selectedCourse.selectionColor}`}>
									🌸
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs font-medium uppercase tracking-wide text-[#9b82a4]">
										Votre atelier
									</p>
									<p
										className={`mt-1 font-semibold ${selectedCourse.fontFamily} ${selectedCourse.textColor}`}>
										{selectedCourse.name}
									</p>
									<p className="mt-1 text-xs text-[#88768e]">
										{selectedCourse.durationMinutes} minutes
									</p>
								</div>
								<button
									type="button"
									onClick={() => {
										setStep(1);
										setErrorMessage("");
									}}
									className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[#7953a3] hover:bg-[#f1e3f6]">
									Modifier
								</button>
							</div>

							{/* Créneau et places */}
							<section>
								<h2
									style={reservationTextStyle}
									className="text-lg font-bold">
									Choisissez votre créneau
								</h2>
								<p className="mt-1 text-sm text-[#88768e]">
									Choisissez la date qui vous convient.
								</p>

								<label
									htmlFor="slot"
									style={reservationTextStyle}
									className="mt-4 block text-sm font-semibold text-[#594562]">
									Date et heure
								</label>

								{now === null ? (
									<p className="mt-2 rounded-xl bg-[#faf5fc] p-4 text-sm text-[#806d87]">
										Recherche des prochaines dates...
									</p>
								) : availableSlots.length > 0 ? (
									<>
										<select
											id="slot"
											value={selectedSlotId}
											onChange={(event) => handleSlotChange(event.target.value)}
											required
											className={inputClass}>
											<option value="">Sélectionner une date</option>
											{availableSlots.map((slot) => (
												<option
													key={slot.id}
													value={slot.id}
													disabled={slot.seatsAvailable === 0}>
													{new Date(slot.startsAt).toLocaleString("fr-FR", {
														dateStyle: "medium",
														timeStyle: "short",
														timeZone: "Europe/Paris",
													})}
													{" — "}
													{slot.seatsAvailable === 0
														? "Complet"
														: `${slot.seatsAvailable} place(s)`}
													{" — "}
													{(slot.priceCents / 100).toFixed(2)} €
												</option>
											))}
										</select>

										{searchPeriod > 30 && (
											<p className="mt-2 text-xs leading-5 text-[#98722d]">
												Aucune date dans les 30 prochains jours. Recherche
												étendue à {searchPeriod} jours.
											</p>
										)}

										{availableSlots.every(
											(slot) => slot.seatsAvailable === 0,
										) && (
											<p className="mt-2 text-sm text-[#a16d32]">
												Tous les créneaux affichés sont complets.
											</p>
										)}
									</>
								) : (
									<p className="mt-3 rounded-xl bg-[#fff7e8] p-4 text-sm leading-5 text-[#8b6528]">
										Aucune date disponible dans les 90 prochains jours. Veuillez
										réessayer plus tard.
									</p>
								)}

								{selectedSlot && selectedSlot.seatsAvailable > 0 && (
									<div className="mt-4">
										<label
											htmlFor="seats"
											className="block text-sm font-semibold text-[#594562]">
											Nombre de places
										</label>
										<select
											id="seats"
											value={seats}
											onChange={(event) => setSeats(Number(event.target.value))}
											className={inputClass}>
											{Array.from(
												{ length: Math.min(8, selectedSlot.seatsAvailable) },
												(_, index) => index + 1,
											).map((number) => (
												<option
													key={number}
													value={number}>
													{number} {number === 1 ? "place" : "places"}
												</option>
											))}
										</select>

										<div className="mt-4 flex items-center justify-between rounded-xl bg-white  px-4 py-3">
											<span className="text-sm text-[#755d80]">
												Total estimé
											</span>
											<span
												className={`text-xl font-bold ${selectedCourse.textColor}`}>
												{((selectedSlot.priceCents * seats) / 100).toFixed(2)} €
											</span>
										</div>
									</div>
								)}
							</section>

							{/* Coordonnées sur la même page */}
							<section>
								<h2
									style={reservationTextStyle}
									className="text-lg font-bold text-[#493650]">
									Vos coordonnées
								</h2>
								<p className="mt-1 text-sm text-[#88768e]">
									Pour préparer votre réservation.
								</p>

								<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label
											htmlFor="firstName"
											style={reservationTextStyle}
											className="text-sm font-semibold text-[#594562]">
											Prénom *
										</label>
										<input
											id="firstName"
											value={firstName}
											onChange={(event) => setFirstName(event.target.value)}
											required
											autoComplete="given-name"
											className={inputClass}
											placeholder="Votre prénom"
										/>
									</div>

									<div>
										<label
											htmlFor="lastName"
											style={reservationTextStyle}
											className="text-sm font-semibold text-[#594562]">
											Nom *
										</label>
										<input
											id="lastName"
											value={lastName}
											onChange={(event) => setLastName(event.target.value)}
											required
											autoComplete="family-name"
											className={inputClass}
											placeholder="Votre nom"
										/>
									</div>
								</div>

								<div className="mt-4">
									<label
										htmlFor="email"
										style={reservationTextStyle}
										className="text-sm font-semibold text-[#594562]">
										Adresse email *
									</label>
									<input
										id="email"
										type="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										required
										autoComplete="email"
										className={inputClass}
										placeholder="vous@exemple.fr"
									/>
								</div>

								<div className="mt-4">
									<label
										htmlFor="phone"
										style={reservationTextStyle}
										className="text-sm font-semibold text-[#594562]">
										Téléphone{" "}
										{requiresPhone ? (
											<span className="text-[#b64d67]">* obligatoire</span>
										) : (
											<span className="font-normal text-[#a08ea5]">
												(facultatif)
											</span>
										)}
									</label>
									<input
										id="phone"
										type="tel"
										value={phone}
										onChange={(event) => {
											setPhone(event.target.value);
											setErrorMessage("");
										}}
										required={requiresPhone}
										autoComplete="tel"
										className={inputClass}
										placeholder="06 12 34 56 78"
									/>
								</div>
							</section>

							{errorMessage && (
								<p
									role="alert"
									className="rounded-xl border border-[#f4cbd5] bg-[#fff0f3] p-4 text-sm leading-5 text-[#a33e58]">
									{errorMessage}
								</p>
							)}

							{/* Outils de test gardés, mais repliés */}
							<details className="rounded-xl border border-[#eee1f0] bg-[#fdf9fe] p-4">
								<summary className="cursor-pointer text-sm font-semibold text-[#7953a3]">
									Options de test (développeur)
								</summary>

								<div className="mt-4">
									<label
										htmlFor="testMode"
										className="block text-sm font-medium text-[#594562]">
										Simuler une réponse
									</label>
									<select
										id="testMode"
										value={testMode}
										onChange={(event) => {
											setTestMode(event.target.value as TestMode);
											setErrorMessage("");
										}}
										className={inputClass}>
										<option value="success">Réservation réussie</option>
										<option value="full">409 — slot_full</option>
										<option value="cancelled">409 — slot_cancelled</option>
										<option value="phone_required">422 — phone_required</option>
										<option value="too_many_seats">422 — too_many_seats</option>
										<option value="rate_limited">429 — rate_limited</option>
										<option value="origin_not_allowed">
											403 — origin_not_allowed
										</option>
										<option value="network">Erreur réseau</option>
									</select>

									<label className="mt-4 flex items-start gap-2 text-sm text-[#755d80]">
										<input
											type="checkbox"
											checked={requiresPhone}
											onChange={(event) => {
												setRequiresPhone(event.target.checked);
												setErrorMessage("");
											}}
											className="mt-1 accent-[#7953a3]"
										/>
										<span>
											Cet atelier exige un numéro de téléphone
											<span className="mt-1 block text-xs text-[#a08ea5]">
												Configuration fictive de requires_phone
											</span>
										</span>
									</label>

									<p className="mt-3 text-xs leading-5 text-[#9b879f]">
										Ces réglages simulent des cas de test. Ils ne contactent pas
										l'API Daisy lorsqu'un mode d'erreur est sélectionné.
									</p>
								</div>
							</details>

							<div className="space-y-3 border-t border-[#f0e5f1] pt-5">
								<button
									style={{
										backgroundColor: selectedCourse.reservationText,
									}}
									type="submit"
									disabled={
										isSubmitting ||
										!selectedSlot ||
										selectedSlot.seatsAvailable === 0
									}
									className={primaryButtonClass}>
									{isSubmitting
										? "Réservation en cours..."
										: "Confirmer ma réservation"}
								</button>

								<button
									type="button"
									onClick={() => {
										setStep(1);
										setErrorMessage("");
									}}
									className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-[#7953a3] transition hover:bg-gray-100">
									← Retour aux ateliers
								</button>

								<p className="text-center text-xs leading-5 text-[#a08ea5]">
									* Champs obligatoires
								</p>
							</div>
						</form>
					)}

					{step === 3 && selectedCourse && selectedSlot && (
						<section className="py-2 text-center">
							<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f0e5f7] text-4xl text-[#7953a3]">
								✓
							</div>

							<h2 className="mt-5 text-2xl font-bold text-[#493650]">
								Demande prête !
							</h2>
							<p className="mt-2 text-sm leading-6 text-[#88768e]">
								Merci {firstName}. Voici le récapitulatif de votre demande.
							</p>
							<div
								className={`mt-7 space-y-4 rounded-2xl border bg-white p-5 text-left ${selectedCourse.selectionColor}`}>
								<div>
									<p className="text-xs font-medium uppercase tracking-wide text-[#9b879f]">
										Votre atelier
									</p>
									<p
										className={`mt-1 font-semibold ${selectedCourse.fontFamily} ${selectedCourse.textColor}`}>
										{selectedCourse.name}
									</p>
								</div>

								<div className="border-t border-[#eee1f0] pt-4">
									<p className="text-xs font-medium uppercase tracking-wide text-[#9b879f]">
										Date et heure
									</p>
									<p className="mt-1 text-sm text-[#594562]">{formattedDate}</p>
								</div>

								<div className="border-t border-[#eee1f0] pt-4">
									<p className="text-xs font-medium uppercase tracking-wide text-[#9b879f]">
										Participant(e)
									</p>
									<p className="mt-1 text-sm text-[#594562]">
										{firstName} {lastName}
									</p>
									<p className="mt-1 text-sm text-[#88768e]">{email}</p>
									{phone.trim() && (
										<p className="mt-1 text-sm text-[#88768e]">{phone}</p>
									)}
								</div>

								<div className="flex items-center justify-between border-t border-[#eee1f0] pt-4">
									<div>
										<p className="text-sm text-[#88768e]">
											{seats} {seats === 1 ? "place" : "places"}
										</p>
										<p className="mt-1 text-xs text-[#a08ea5]">
											Code : {confirmationCode}
										</p>
									</div>
									<p
										className={`text-xl font-bold ${selectedCourse.textColor}`}>
										{((selectedSlot.priceCents * seats) / 100).toFixed(2)} €
									</p>
								</div>
							</div>

							<p className="mt-5 rounded-xl bg-[#fff7e8] p-4 text-left text-xs leading-5 text-[#8b6528]">
								Mode prototype : cette confirmation est une démonstration.
								Vérifiez que l'API est bien reliée au service Daisy avant toute
								mise en production.
							</p>

							<button
								type="button"
								onClick={resetForm}
								style={buttonStyle}
								className={`${primaryButtonClass} mt-6`}>
								Faire une autre réservation
							</button>
						</section>
					)}
				</div>

				<footer className="border-t border-[#f0e5f1] bg-[#fdf9fe] px-6 py-4 text-center text-xs text-[#a08ea5]">
					Un moment créatif, rien que pour vous ✿
				</footer>
			</div>
		</main>
	);
}
