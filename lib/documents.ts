export type DocumentPhase = "trial" | "program";

export type DocumentDefinition = {
  title: string;
  /** Which player-journey phases require this document. */
  phases: DocumentPhase[];
  /**
   * Optional cutoff: only required for players whose trial starts on or
   * after this date (YYYY-MM-DD). Lets us add new required docs without
   * disrupting in-flight signings. Omit to require from all players.
   */
  effectiveFrom?: string;
  sections: { heading: string; body: string }[];
};

export const DOCUMENT_CONTENT: Record<string, DocumentDefinition> = {
  liability_waiver: {
    title: 'Liability Waiver',
    phases: ['trial', 'program'],
    sections: [
      {
        heading: 'Assumption of Risk',
        body: 'By participating in the 1. FC Köln International Talent Pathway (ITP) trial program, I acknowledge that football training, competitive matches, fitness testing, and related physical activities carry inherent risks of injury, including but not limited to sprains, fractures, concussions, and other bodily harm. I voluntarily assume all such risks associated with my participation in the trial, including training sessions at Sportpark Widdersdorf, matches, travel to and from training facilities, and any organized program activities.',
      },
      {
        heading: 'Release of Liability',
        body: 'I hereby release and hold harmless 1. FC Köln, Warubi Sports, and their respective officers, employees, coaches, volunteers, and agents from any and all claims, damages, losses, or expenses arising from my participation in the ITP trial program, except in cases of gross negligence or willful misconduct. This release applies to injuries sustained during training, matches, physical testing, transportation provided by the program, and use of program housing.',
      },
      {
        heading: 'Insurance',
        body: 'For stays of one month or longer, Warubi Sports arranges health and accident insurance coverage for the full duration of the trial. For stays shorter than one month, I am responsible for holding my own valid health and accident insurance covering my stay in Germany and will provide proof of coverage prior to the start of the trial. In either case, I understand that I am responsible for any medical costs not covered by the applicable insurance.',
      },
      {
        heading: 'Acknowledgement',
        body: 'I confirm that I have read and understood this Liability Waiver in its entirety. I am signing this document voluntarily and with full knowledge of the risks involved. If I am under 18 years of age, my parent or legal guardian has also reviewed and approved this waiver on my behalf.',
      },
    ],
  },
  code_of_conduct: {
    title: 'Code of Conduct',
    phases: ['trial', 'program'],
    sections: [
      {
        heading: 'Expected Behavior',
        body: 'All participants in the ITP trial program are expected to conduct themselves with professionalism, respect, and integrity at all times. This includes respectful treatment of coaches, staff, fellow players, host families, and members of the public. Discrimination, bullying, harassment, or any form of violent behavior will not be tolerated. Players represent 1. FC Köln and Warubi Sports and are expected to uphold the values of both organizations on and off the pitch.',
      },
      {
        heading: 'Training & Attendance',
        body: 'Attendance at all scheduled training sessions, matches, physical testing, and language classes is mandatory unless excused by a coach or program coordinator due to illness or injury. Players must arrive on time and prepared for all activities. Repeated unexcused absences or persistent lateness may result in removal from the trial. Players must follow all instructions from coaching staff during training and matches.',
      },
      {
        heading: 'Accommodation',
        body: 'Players living in program housing must keep their rooms and shared spaces clean and tidy. Quiet hours are from 22:00 to 07:00. Alcohol and drug use is strictly prohibited. Overnight guests are not permitted without prior written approval from program staff. Players are responsible for any damage they cause to the property. Curfew is at 23:00 on training days and 00:00 on non-training days.',
      },
      {
        heading: 'Social Media & Communication',
        body: 'Players may share their ITP experience on social media but must not post content that is offensive, inappropriate, or damaging to the reputation of 1. FC Köln, Warubi Sports, fellow players, or staff. Confidential program information, including tactical plans, internal communications, and other players\' personal details, must not be shared publicly. When in doubt, consult program staff before posting.',
      },
      {
        heading: 'Consequences',
        body: 'Violations of this Code of Conduct will be addressed on a case-by-case basis. Consequences may include a verbal or written warning, temporary suspension from training or matches, or immediate dismissal from the trial. Serious violations — including illegal activity, violence, or substance abuse — may result in immediate termination and early return home at the player\'s own expense. All decisions by program management are final.',
      },
    ],
  },
  media_consent: {
    title: 'Media & Photo Consent',
    phases: ['trial', 'program'],
    sections: [
      {
        heading: 'Consent',
        body: 'I grant 1. FC Köln and Warubi Sports permission to capture and use photographs, video recordings, and audio recordings of me taken during the ITP trial program. This includes, but is not limited to, images and footage from training sessions, matches, events, testing, and daily program activities. I understand that my name, likeness, and biographical information may be used alongside these materials.',
      },
      {
        heading: 'Usage',
        body: 'The captured media may be used for promotional, educational, and informational purposes across all platforms, including but not limited to: official websites, social media accounts (Instagram, TikTok, YouTube, Facebook, X), printed materials, press releases, presentations to prospective players and partners, and internal documentation. No compensation will be provided for the use of these materials.',
      },
      {
        heading: 'Duration & Withdrawal',
        body: 'This consent is valid for the duration of the trial and for a period of 5 years following its conclusion. I may withdraw my consent at any time by submitting a written request to Warubi Sports at info@warubi-sports.com. Upon withdrawal, reasonable efforts will be made to remove my likeness from future publications, though materials already in circulation cannot be recalled. Withdrawal of consent does not affect the lawfulness of media use prior to the withdrawal.',
      },
    ],
  },
  medical_consent: {
    title: 'Medical Treatment Consent',
    phases: ['trial', 'program'],
    // Added 2026-04-14 after porting from the women's app. Only required
    // for players whose trial starts on or after the cutoff so in-flight
    // prospects (Jadon: Apr 16, etc.) aren't surprised by a new doc
    // mid-journey. Drop this field once all pre-cutoff prospects have
    // cleared their trials and been placed.
    effectiveFrom: '2026-04-23',
    sections: [
      {
        heading: 'Consent to Treatment',
        body: 'In the event of illness, injury, or medical emergency during my participation in the 1. FC Köln International Talent Pathway (ITP), I authorize 1. FC Köln and Warubi Sports staff to arrange necessary medical treatment on my behalf. This includes, but is not limited to, first aid, ambulance transport, emergency room visits, and consultation with medical professionals. If I am unable to give consent at the time of treatment (e.g., due to unconsciousness), I authorize program staff to make medical decisions in my best interest until my emergency contact can be reached. If I am under 18, my parent or legal guardian has reviewed and approved this consent on my behalf.',
      },
      {
        heading: 'Medical Information Sharing',
        body: 'I consent to the sharing of relevant medical information — including pre-existing conditions, allergies, medications, and injury history — with coaching staff, team physiotherapists, and medical professionals involved in my care during the ITP. This information will be treated confidentially and used solely for the purpose of ensuring my health and safety. I agree to disclose all relevant medical conditions on my player registration form prior to the start of the trial or program.',
      },
      {
        heading: 'Emergency Contact',
        body: 'I confirm that the emergency contact information provided in my player registration is accurate and up to date. I understand that program staff will attempt to contact my designated emergency contact as soon as reasonably possible in the event of a medical emergency. I accept responsibility for ensuring my emergency contact is reachable during the duration of the trial or program and for notifying program staff immediately of any changes to this information.',
      },
    ],
  },
  program_agreement: {
    title: 'ITP Program Agreement',
    phases: ['program'],
    sections: [
      {
        heading: 'Program Commitment & Duration',
        body: 'I commit to participate in the 1. FC Köln International Talent Pathway (ITP) program for the full duration specified in my placement agreement, typically from preseason in early July through the end of the competitive season the following May. I understand the program includes team training, competitive matches, physical testing, language classes, educational support, and team activities, and that my commitment extends across all of these elements. I agree to follow the program calendar — including travel dates, break periods, and return dates — as communicated by program staff.',
      },
      // HIDDEN FOR REVIEW — Max wants to discuss the legal language
      // before these sections go live. Drafts preserved here; splice
      // back into the sections array once approved:
      //
      // {
      //   heading: 'Financial Terms',
      //   body: 'I acknowledge the program fees as presented in my placement agreement, covering housing, meals where provided, training, and program logistics. I understand that items not explicitly included — travel outside the program, personal expenses, and discretionary purchases — are my responsibility. Payment is due in accordance with the schedule agreed upon with Warubi Sports. Non-payment or late payment may affect my participation status, and I will communicate proactively with program staff if any financial concerns arise.',
      // },
      // {
      //   heading: 'Cancellation & Withdrawal',
      //   body: 'I understand that cancellation of my participation after the program start date results in financial and operational consequences as outlined in my placement agreement. Deposits and fees paid are generally non-refundable once the program begins. If I withdraw voluntarily, I will follow the exit process: returning program-issued equipment, vacating housing, and completing a handover meeting with staff. If program management determines that my continued participation is not appropriate due to a violation of the Code of Conduct or other serious concerns, I accept that my participation may be terminated and that I will return home at my own expense.',
      // },
      {
        heading: 'Program Expectations',
        body: 'I commit to giving my full effort to every training session, match, and testing day. I will follow instructions from coaching and program staff, train at the intensity and focus expected, and respect the group environment. I understand that performance, attitude, and off-pitch conduct are all evaluated throughout the program, and that future pathway opportunities — college placement, professional trial referrals, continued ITP enrollment — depend on all three. I will engage openly with the development process: accepting feedback, working on identified areas of growth, and communicating with staff about my progress.',
      },
      {
        heading: 'Medical & Insurance',
        body: 'For stays of one month or longer, Warubi Sports arranges health and accident insurance coverage for the full program duration. For stays shorter than one month, I am responsible for holding my own valid health and accident insurance covering my stay in Germany and will provide proof of coverage prior to the start of the program. I will promptly disclose any injury, illness, or medical condition affecting my participation, and I will follow return-to-play protocols set by the program\'s medical staff or physiotherapists. Any medical costs not covered by the applicable insurance remain my responsibility.',
      },
      {
        heading: 'Acknowledgement',
        body: 'I have read and understood this Program Agreement in its entirety, along with the separate Liability Waiver, Code of Conduct, Media Consent, Medical Treatment Consent, and Housing Living Agreement that I am also signing. I am committing voluntarily and with full understanding of the financial, physical, and time commitments involved. If I am under 18, my parent or legal guardian has reviewed and approved this agreement on my behalf.',
      },
    ],
  },
  housing_agreement: {
    title: 'Housing Living Agreement',
    phases: ['program'],
    sections: [
      {
        heading: 'Use of Program Housing',
        body: 'Program housing is provided as part of my ITP placement for the duration of my participation. I understand that housing assignments — which house and which room — are made by program management and may be adjusted based on operational needs. I will keep my assigned room clean and organized, respect the living space, and treat the furniture, appliances, and common areas as I would my own home.',
      },
      {
        heading: 'Respect & Shared Living',
        body: 'I will live respectfully with my housemates. Quiet hours are from 22:00 to 07:00 on training days and from 23:00 to 08:00 on non-training days. I will keep noise, music, and guests within reasonable limits so housemates can rest and recover. Shared spaces — kitchen, living room, bathrooms, laundry — will be kept clean, and I will complete my share of housekeeping chores as assigned through the program. Conflicts with housemates will be addressed directly and respectfully; if they cannot be resolved, I will involve program staff.',
      },
      {
        heading: 'Damage & Liability',
        body: 'I am responsible for any damage I cause to the housing, furniture, appliances, or common areas, whether through negligence or intentional action. Normal wear and tear is expected and not chargeable. Damage beyond normal wear — broken windows, damaged walls, burned surfaces, stained fabric, missing items — will be assessed and deducted from my deposit or billed to me directly. Damage caused during unauthorized guest presence is my sole responsibility.',
      },
      {
        heading: 'Prohibited Activities',
        body: 'The following are strictly prohibited in program housing: illegal drug use; smoking or vaping indoors; use of candles, incense, or any open flame; alcohol consumption for residents under 18 or in excess of program limits for older residents; firearms, weapons, or explosives; commercial activity operated from the housing; and subletting, sharing keys, or hosting anyone not approved by program staff. Violations result in immediate review of my housing privileges and may lead to removal from the program.',
      },
      {
        heading: 'Visitors & Overnight Guests',
        body: 'Visitors may be hosted in common areas during reasonable hours with prior notice to program staff. Overnight guests are not permitted except by specific written approval from program management for exceptional circumstances such as family visits. Family visits during designated visit periods are coordinated separately through the program\'s visitor travel process.',
      },
      {
        heading: 'Move-Out & Inspection',
        body: 'At the end of my program, or upon withdrawal for any reason, I will vacate the housing within the timeframe set by program staff. Before departure, I will remove all personal belongings, clean my room and assigned common-area responsibilities, return program-issued keys and equipment, and complete an exit inspection with a staff member. Any items left behind after my departure date may be disposed of at the program\'s discretion. My deposit, minus any damage or outstanding fees, will be returned to the account I provide.',
      },
    ],
  },
};

/**
 * Returns the required documents for a given player-journey phase,
 * preserving definition order (which is also the display/signing order).
 *
 * Pass the player's `trial_start_date` as `referenceDate` to respect any
 * doc's `effectiveFrom` cutoff. Prospects whose trials were scheduled
 * before a doc's cutoff are exempt from signing it. Omit `referenceDate`
 * to ignore cutoffs (e.g. in staff-side preview contexts).
 */
export function getDocumentsForPhase(
  phase: DocumentPhase,
  referenceDate?: string | null
): { type: string; title: string }[] {
  return Object.entries(DOCUMENT_CONTENT)
    .filter(([, doc]) => {
      if (!doc.phases.includes(phase)) return false;
      if (doc.effectiveFrom && referenceDate !== undefined) {
        // Unknown trial date (null) is treated as pre-cutoff — protects
        // existing committed prospects whose trials weren't formally
        // recorded from seeing a new doc appear mid-flight.
        if (!referenceDate || referenceDate < doc.effectiveFrom) {
          return false;
        }
      }
      return true;
    })
    .map(([type, doc]) => ({ type, title: doc.title }));
}
