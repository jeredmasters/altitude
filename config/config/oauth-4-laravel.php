<?php
return array( 

    /*
    |--------------------------------------------------------------------------
    | oAuth Config
    |--------------------------------------------------------------------------
    */

    /**
     * Storage
     */
    'storage' => 'Session', 

    /**
     * Consumers
     */
    'consumers' => array(

        /**
         * Facebook
         */
        'Facebook' => array(
            'client_id'     => '1540669282838050',
            'client_secret' => '23130912764e179fe7cc9ef65512e439',
            'scope'         => array('email'),
        ),  

        'Google' => array(
            'client_id'     => '589651992061-alb12221vg6p6omi05lfhphi3f6slumb.apps.googleusercontent.com',
            'client_secret' => 'aDwjJgc87duILsBCIoK8RqrT',
            'scope'         => array('userinfo_email', 'userinfo_profile'),
        ),  
        'Linkedin' => array(
            'client_id'     => '759as464txi0c2',
            'client_secret' => '57eKk3GjJ99xc3RO',
            'scope'         => array('r_emailaddress')
        ),      

    )

);
