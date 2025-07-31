import Create from './create';
import View from './view';

const AnalyticsConfig = {
    sourceCreate: {
        name: 'Create',
        component: Create
    },
    view: {
        name: 'View',
        path: '/view',
        component: View
    }
}

export default AnalyticsConfig;
