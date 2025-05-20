import { getVehicleList } from "../../../../lib/ContentApi";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const dataApi = (await req.json());
    console.log("la data del formulario", dataApi);

  let response = {};
  if (dataApi !== undefined) {
    response = await getVehicleList(dataApi.propertyId);
  }
  return NextResponse.json(response);
}
