import 'react-widgets/dist/css/react-widgets.css';

import { DateTimePicker } from 'react-widgets';
import moment from 'moment';
import momentLocalizer from 'react-widgets-moment';

moment.locale('en');
momentLocalizer();

export default DateTimePicker;
