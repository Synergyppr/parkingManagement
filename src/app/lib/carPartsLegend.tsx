export const linkedGroups = [
  ["fullBumper1", "fullBumper2", "grill"], // Front Bumper - Car 1
  ["carBody", "rearBumper"], // Rear Bumper - Car 2
  ["rightFront", "rightFender", "rightViewBumper"], // Front Bumper - Car 3
  ["backBumper1", "backFender1", "bodyLine1", "rightBackGlass"],
  ["frontTire1", "frontRim1", "frontCap1"],
  ["backTire1", "backRim1", "backCap1"],
  ["rightFrontDoor1", "rightFrontHandle1", "rightFrontGlass"],
  ["rightBackDoor1", "rightBackHandle1", "rightMiddleGlass"],
  ["leftFront", "leftFender", "leftViewBumper"],
  ["backBumper2", "backFender2", "bodyLine2", "leftBackGlass"],
  ["frontTire2", "frontRim2", "frontCap2"],
  ["backTire2", "backRim2", "backCap2"],
  ["leftFrontDoor", "leftFrontHandle", "leftFrontGlass"],
  ["leftBackDoor1", "leftBackHandle1", "leftMiddleGlass"],
];

export const carParts = {
  frontViewCar: {
    fullBumper1: "Front Bumper",
    fullBumper2: "Front Bumper",
    grill: "Front Bumper",
    hood: "Hood",
    rightHeadLight: "Right Headlight",
    leftHeadLight: "Left Headlight",
    windShield: "Windshield",
  },
  rearViewCar: {
    carBody: "Rear Bumper",
    trunk: "Trunk",
    rearBumper: "Rear Bumper",
    leftTrunkLight: "Left Rear Light",
    rightTrunkLight: "Right Rear Light",
    rearWindShield: "Rear Windshield",
  },
  passengerViewCar: {
    rightFront: "Front Bumper",
    rightFender: "Front Bumper",
    rightViewBumper: "Front Bumper",
    backBumper1: "Back Bumper",
    backFender1: "Back Bumper",
    bodyLine1: "Back Bumper",
    rightBackGlass: "Back Bumper",
    frontTire1: "Front Tire",
    frontRim1: "Front Tire",
    frontCap1: "Front Tire",
    backTire1: "Back Tire",
    backRim1: "Back Tire",
    backCap1: "Back Tire",
    rightFrontDoor1: "Front Door",
    rightFrontHandle1: "Front Door",
    rightFrontGlass: "Front Door",
    rightBackDoor1: "Rear Door",
    rightBackHandle1: "Rear Door",
    rightMiddleGlass: "Rear Door",
    passengerRearViewMirror: "Passenger Side Mirror",
  },
  driverViewCar: {
    leftFront: "Front Bumper",
    leftFender: "Front Bumper",
    leftViewBumper: "Front Bumper",
    backBumper2: "Back Bumper",
    backFender2: "Back Bumper",
    bodyLine2: "Back Bumper",
    leftBackGlass: "Back Bumper",
    frontTire2: "Front Tire",
    frontRim2: "Front Tire",
    frontCap2: "Front Tire",
    backTire2: "Back Tire",
    backRim2: "Back Tire",
    backCap2: "Back Tire",
    leftFrontDoor: "Front Door",
    leftFrontHandle: "Front Door",
    leftFrontGlass: "Front Door",
    leftBackDoor1: "Rear Door",
    leftBackHandle1: "Rear Door",
    leftMiddleGlass: "Rear Door",
    driverRearViewMirror: "Driver Side Mirror",
  },
};

export const findLinkedGroup = (partId: string) =>
  linkedGroups.find((group) => group.includes(partId)) || [partId];

export const generateLabelsMap = (parts: Record<string, string>) =>
  Object.entries(parts).reduce((acc, [id, label]) => {
    if (!acc[label]) acc[label] = [];
    acc[label].push(id);

    return acc;
  }, {} as Record<string, string[]>);
