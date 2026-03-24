export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const GUEST_FAQS: FAQItem[] = [
  {
    id: "g1",
    question: "How do I book a house on Comfort Haven?",
    answer: "Simply browse through our listings, select a property that fits your needs, choose your dates, and click 'Book Now'. Follow the prompts to complete your payment and confirm your reservation.",
  },
  {
    id: "g2",
    question: "What should I look for in a listing?",
    answer: "Pay attention to the property description, amenities, house rules, and reviews from previous guests. Also, check the location and price to ensure it meets your expectations.",
  },
  {
    id: "g3",
    question: "How do I pay for my booking?",
    answer: "We support various secure payment methods including credit/debit cards and bank transfers. All payments are handled through our encrypted platform to ensure your security.",
  },
  {
    id: "g4",
    question: "Can I cancel my booking?",
    answer: "Yes, you can cancel your booking from the 'Bookings' section. Please check the specific cancellation policy of the property, as refund eligibility depends on how close the cancellation is to the check-in date.",
  },
  {
    id: "g5",
    question: "What if the property doesn't match the description?",
    answer: "We strive for accuracy in all listings. If you find significant discrepancies upon arrival, please contact our support team immediately within 24 hours of check-in to resolve the issue.",
  },
];

export const HOST_FAQS: FAQItem[] = [
  {
    id: "h1",
    question: "How do I list my house for rent?",
    answer: "Navigate to the 'Host' tab and click 'List Property'. Provide accurate details about your home, upload high-quality photos, set your price and availability, and submit for approval.",
  },
  {
    id: "h2",
    question: "When will I receive my payment?",
    answer: "Payouts are typically processed 24 hours after the guest's scheduled check-in time. This ensures both parties are satisfied before the funds are released.",
  },
  {
    id: "h3",
    question: "How do I ensure my house is safe?",
    answer: "We recommend verifying guest identities through our platform and setting clear house rules. You can also require a security deposit for added peace of mind.",
  },
  {
    id: "h4",
    question: "What if a guest damages my property?",
    answer: "In the unfortunate event of damage, document the issue with photos and contact our support team within 48 hours. We will assist you in the claims process according to our Host Protection policy.",
  },
  {
    id: "h5",
    question: "How do I improve my property's ranking?",
    answer: "Maintain a high response rate, provide accurate descriptions, keep your calendar updated, and encourage guests to leave positive reviews by providing a great experience.",
  },
];
