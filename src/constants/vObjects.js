import {number, object, ref as yupRef, string} from "yup";
const VObjects = {
    quantity_unit: string()
        .trim()
        .required('quantity-unit-required'),
    quantity: string()
        .trim()
        .required('quantity-required'),
    company: string()
        .trim()
        .required('company-required'),
    subject: string()
        .trim()
        .required('subject-required')
        .min(3, 'subject-min-length-required'),
    server_name: string()
        .trim()
        .required('server-name-required')
        .min(3, 'server-name-min-length-required'),

    hostname: string()
        .trim()
        .required('hostname-required')
        .min(6, 'hostname-min-length-required'),

    first_name: string()
        .trim()
        .required('first-name-required')
        .min(3, 'first-name-min-length-required'),
    last_name: string()
        .trim()
        .required('last-name-required')
        .min(3, 'last-name-min-length-required'),
    slug: string()
        .trim()
        .required('slug-required')
        .min(3, 'slug-min-length-required'),
    title: string()
        .trim()
        .required('title-required')
        .min(3, 'title-min-length-required'),
    value: string()
        .trim()
        .required('value-required')
        .min(1, 'value-required'),
    circle_image: string()
        .trim()
        .required('image-url-required')
        .url('url-valid-format-required'),
    square_image: string()
        .trim()
        .required('image-url-required')
        .url('url-valid-format-required'),
    Pass: string()
        .trim()
        .required('password-required'),
    password: string()
        .trim()
        .required('password-required')
        .min(8, 'password-min-length-required')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 'password-strong-pattern-required'),
    current_password: string()
        .trim()
        .required('password-required')
        .min(8, 'password-min-length-required')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 'password-strong-pattern-required'),
    email: string()
        .trim()
        .required('email-required')
        .email('email-valid-format-required'),
    mobile: string()
        .trim()
        .required('mobile-required')
        .length(11, 'mobile-length-required')
        .matches(/^\+?\d{1,3}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, 'mobile-valid-format-required'),
    verify_password: string()
        .trim()
        .required('verify-password-required')
        .oneOf([yupRef('password')], 'password-match-required'),
    password_confirm: string()
        .trim()
        .required('verify-password-required')
        .oneOf([yupRef('password')], 'password-match-required'),
    name: string()
        .trim()
        .required('name-required')
        .min(3, 'name-min-length-required'),
    code: string()
        .trim()
        .required('code-required')
        .length(19, 'code-min-length-required'),
    stock_count: number()
        .typeError('stock-count-valid-format-required')
        .required('stock-count-required'),
    amount: number()
        .typeError('amount-valid-format-required')
        .required('amount-required'),
    package: string()
        .trim()
        .required('package-required')
        .min(3, 'package-min-length-required'),
    username: string()
        .trim()
        .required('username-required')
        .min(3, 'username-min-length-required'),
    phone: string()
        .trim()
        .required('phone-required'),
    ///TODO: add validate for website
    website: string()
        .trim()
        .required('website-required'),
    country: string()
        .trim()
        .required('country-required')
        .min(3, 'country-min-length-required'),
    state: string()
        .trim()
        .required('state-required')
        .min(3, 'state-min-length-required'),
    city: string()
        .trim()
        .required('city-required')
        .min(3, 'city-min-length-required'),
    zip_code: string()
        .trim()
        .required('zip-code-required')
        .min(3, 'zip-code-min-length-required'),
    address_1: string()
        .trim()
        .required('address-required')
        .min(3, 'address-min-length-required'),
    address_2: string()
        .trim()
        .required('address-required')
        .min(3, 'address-min-length-required'),
    text_description: string()
        .trim()
        .required('description-required')
        .min(3, 'description-min-length-required'),
    description: string()
        .trim()
        .required('description-required')
        .min(3, 'description-min-length-required'),
    key: string()
        .trim()
        .required('key-required')
        .min(3, 'key-min-length-required'),
    module: string()
        .trim()
        .required('module-required')
        .min(3, 'module-min-length-required'),
    resource: string()
        .trim()
        .required('resource-required')
        .min(3, 'resource-min-length-required'),
    handler: string()
        .trim()
        .required('handler-required')
        .min(3, 'handler-min-length-required'),
    role: string()
        .trim()
        .required('role-required')
        .min(3, 'role-min-length-required'),
    type: string()
        .trim()
        .required('type-required')
        .min(3, 'type-min-length-required'),
    national_id: string()
        .trim()
        .required('national-id-required')
        .length(10, 'national-id-length-required')
        .matches(/^\+?\d{1,3}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/, 'national-id-format-required'),
    adapter: object({adapter: string().required('plugin-required')})
        .required('plugin-required'),
    sandboxed: string()
        .trim()
        .required('sandboxed-required'),
    UserName: string()
        .trim()
        .required('username-required')
        .min(3, 'username-min-length-required'),
    MerchantId: string()
        .trim()
        .required('merchant-id-required'),
    user: object({email: string().required('user-required')})
        .required('merchant-id-required'),
    department: object({name: string().required('department-required')}),
    identity: string()
        .trim()
        .required('username-required'),
    credential: string()
        .trim()
        .required('password-required')
        .min(8, 'password-min-length-required')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 'password-strong-pattern-required')
};

export default VObjects;
