export interface CredentialsInterface {
  username: string;
  password: string;
  propertyId?: string;
}

export interface SessionUserInterface {
    id: string;
    email: string;
    name: string;
    accountStatus: string;
    propertyId: string;
  }

//Auth User Update //////////////////////////////////////////////////////////////
export interface UpdateUserInterface {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  userIdentifier: string;
  location: string;
  // addresses: AddressInterface[];
  // phones: PhoneInterface[];
  // emails: EmailInterface[];
  // foodAllergies: FoodAllergyInterface[];
  // foodPreferences: FoodPreferenceInterface[];
  // specialRequests: SpecialRequestInterface[];
}
