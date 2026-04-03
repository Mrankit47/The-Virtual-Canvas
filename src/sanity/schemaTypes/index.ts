import { type SchemaTypeDefinition } from 'sanity';
import category from './category';
import artwork from './artwork';
import photography from './photography';
import order from './order';
import gallery from './gallery';
import userProfile from './userProfile';
import notification from './notification';
import processStep from './processStep';
import coupon from './coupon';
import artStyle from './artStyle';
import sizeOption from './sizeOption';
import paperType from './paperType';
import { otpVerification } from './otpVerification';
import orderUpdate from './orderUpdate';

export const schemaTypes = [
  artwork,
  gallery,
  photography,
  category,
  order,
  coupon,
  artStyle,
  sizeOption,
  paperType,
  userProfile,
  notification,
  processStep,
  otpVerification,
  orderUpdate
];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes,
};
