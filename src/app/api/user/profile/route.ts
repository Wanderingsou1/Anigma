import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { profileUpdateSchema, passwordChangeSchema } from "@/lib/validations/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Profile management is disabled because the database layer was removed." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.currentPassword || body.newPassword || body.confirmPassword) {
      const parsedPassword = passwordChangeSchema.safeParse(body);
      if (!parsedPassword.success) {
        return NextResponse.json(
          { error: "Validation failed", errors: parsedPassword.error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Profile management is disabled because the database layer was removed." },
        { status: 501 }
      );
    }

    const parsedProfile = profileUpdateSchema.safeParse(body);
    if (!parsedProfile.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsedProfile.error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Profile management is disabled because the database layer was removed." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Profile management is disabled because the database layer was removed." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Profile DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
