import React from 'react';
import { Header } from 'watson-react-components';
import Demo from './Demo.jsx';

export default function Index() {
  return (
    <div>
      <Header
        mainBreadcrumbs="Watson Visual Recognition Starter"
        mainBreadcrumbsUrl="http://www.ibm.com/watson/developercloud/visual-recognition.html"
        subBreadcrumbs="WatsonVisualRecognitionBasicJAAQZ"
        subBreadcrumbsUrl="#"
      />
      <Demo />
      <div className="disclaimer--message">
        <h6 className="base--h6" >
          * This system is for demonstration purposes only and is not intended to process
          Personal Data. No Personal Data is to be entered into this system as it may not
          have the necessary controls in place to meet the requirements of the General Data
          Protection Regulation (EU) 2016/679.
        </h6>
      </div>
    </div>
  );
}
