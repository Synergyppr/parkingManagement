export const linkedGroups = [
  ["fullBumper1", "fullBumper2", "grill"], // Front Bumper - Car 1
  ["carBody", "rearBumper"], // Rear Bumper - Car 2
  ["rightFront", "rightFender", "rightViewBumper"], // Front Bumper - Car 3
  ["backBumper1", "backFender1", "bodyLine1", "rightBackGlass"],
  ["frontTire1", "frontRim1", "frontCap1"],
  ["backTire1", "backRim1", "backCap1"],
  ["rightFrontDoor", "rightFrontHandle", "rightFrontGlass"],
  ["rightBackDoor", "rightBackHandle", "rightMiddleGlass"],
  ["leftFront", "leftFender", "leftViewBumper"], // Front Bumper - Car 4
  ["backBumper2", "backFender2", "bodyLine2", "leftBackGlass"],
  ["frontTire2", "frontRim2", "frontCap2"],
  ["backTire2", "backRim2", "backCap2"],
  ["leftFrontDoor", "leftFrontHandle", "leftFrontGlass"],
  ["leftBackDoor", "leftBackHandle", "leftMiddleGlass"],
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
    frontTire1: "Right Front Tire",
    frontRim1: "Right Front Tire",
    frontCap1: "Right Front Tire",
    backTire1: "Right Back Tire",
    backRim1: "Right Back Tire",
    backCap1: "Right Back Tire",
    rightFrontDoor: "Right Front Door",
    rightFrontHandle: "Right Front Door",
    rightFrontGlass: "Right Front Door",
    rightBackDoor: "Right Rear Door",
    rightBackHandle: "Right Rear Door",
    rightMiddleGlass: "Right Rear Door",
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
    frontTire2: "Left Front Tire",
    frontRim2: "Left Front Tire",
    frontCap2: "Left Front Tire",
    backTire2: "Left Back Tire",
    backRim2: "Left Back Tire",
    backCap2: "Left Back Tire",
    leftFrontDoor: "Left Front Door",
    leftFrontHandle: "Left Front Door",
    leftFrontGlass: "Left Front Door",
    leftBackDoor: "Left Rear Door",
    leftBackHandle: "Left Rear Door",
    leftMiddleGlass: "Left Rear Door",
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
