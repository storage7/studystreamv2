import { NextResponse } from "next/server";

export async function GET() {
  // Manually enter your desired stats here. 
  // Update these numbers whenever you want the dashboard to change.
  return NextResponse.json({
    batches: 2,       // Replace with your manual batch count
    subjects: 9,      // Replace with your manual subject count
    lectures: 129,    // Replace with your manual lecture count
  });
}
