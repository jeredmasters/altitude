<?php


class Company extends BaseModel {
	protected $table = 'companies';
	protected $json = array('settings','subscription_card');
    protected $hidden = array('id','customer_id','subscription_id');
    protected $encrypted = array('subscription_card');

    public static function guid($guid){
        return Company::where('guid','=',$guid)->first();
    }

    public static function changePlan($company, $plan){
        $company = Company::resolve($company);
        $company->subscription_plan = $plan;
        $company->save();

        Subscription::SetSubscription($company,$plan);

        Subscription::DigestCompany($company);
    }

    public static function updateCard($company, $source){
        
        Subscription::SetPaymentDetails($company, $source);

        Subscription::DigestCompany($company);
    }
}