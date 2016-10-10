<?php

/**
 * State short summary.
 *
 * State description.
 *
 * @version 1.0
 * @author jered
 */
class Subscription {
    protected static $private_key_live = "sk_live_qEiXbxF0g8m7KKVto5BhZlq7";
    protected static $private_key_test = "sk_test_37v73XyXsmAHNmXg37bAnnP3";
    protected static $public_key_live = "pk_live_E9YN0vubu1uhjaj64yrTqPQ2";
    protected static $public_key_test = "pk_test_huPzPRaV3rfoW2wuc1PYP1h8";
    
    public static function GetPrivateKey(){
        if (App::environment() == 'production'){
            return static::$private_key_live;
        }
        else{
            return static::$private_key_test;
        }
    }
    public static function GetPublicKey(){
        if (App::environment() == 'production'){
            return static::$public_key_live;
        }
        else{
            return static::$public_key_test;
        }
    }
    public static function SetApiKey(){
        \Stripe\Stripe::setApiKey(static::GetPrivateKey());
    }
    public static function Digest(){
        Company::where('subscription_plan','=',null)->update(array('subscription_status'=>null));

        $companies = Company::whereNotNull('subscription_plan')->get();
        $retval = array();
        foreach($companies as $company){
            $retval[] = static::DigestCompany($company);
        }
        return $retval;
    }
    public static function DigestCompany($company){
        $company = Company::resolve($company);

        $customer = static::GetCustomer($company);
        $subscription = null;

        if ($company->subscription_plan != 'free'){
            $subscription = static::GetSubscription($company);
            if ($subscription == null && $company->subscription_plan !== ''){
                $subscription = static::SetSubscription($company, $company->subscription_plan);
            }
        }

        if ($subscription != null){
            $card = array(
                'type'=> '',
                'last4' => '',
                'name' => '',
                'exp_year' => ''
                );
            if ($customer->cards != null && count($customer->cards->data) > 0){
                $c_card = $customer->cards->data[0];
                $card = array(
                    'type'=> $c_card->brand,
                    'last4' => $c_card->last4,
                    'name' => $c_card->name,
                    'exp_year' => $c_card->exp_year
                    );
            }

            $company->subscription_card = $card;
            $company->subscription_plan = $subscription->plan->id;
            $company->subscription_id = $subscription->id;
            $company->subscription_status = $subscription->status;
            switch($subscription->status){
                case 'active':
                    $company->valid_until = $subscription->current_period_end;
                    break;
                case 'trialing':
                    $company->valid_until = $subscription->trial_end;
                    break;
                default:
                    $company->valid_until = 0;
                    break;
            }
        }
        else{
            $company->subscription_card = array(
                'type'=> '',
                'last4' => '',
                'name' => '',
                'exp_year' => ''
                );
        }

        $company->save();
        return $company;
    }
    public static function SetPaymentDetails($company, $card){
        /*
        $card = array(
            'object' => 'card',
            'exp_month' => '',
            'exp_year' => '',
            'number' => '',
            'cvc' => '',
            'name' => ''
            );
        */
        return static::UpdateCustomer($company, array('source'=>$card));
    }
    public static function UpdateCustomer($company,$changes){
        $customer = static::GetCustomer($company);
        foreach($changes as $key=>$value){
            $customer->$key = $value;
        }
        return $customer->save();
    }
    public static function SetSubscription($company, $plan = 'basic'){
        static::SetApiKey();
        $subscription = static::GetSubscription($company);
        if ($subscription == null){
            $customer = static::GetCustomer($company);
            $subscription = $customer->subscriptions->create(array('plan' => $plan));
            $company->subscription_id = $subscription->id;
            $company->save();
        }
        else{
            $subscription->plan = $plan;
            $subscription->save();
        }
        return $subscription;
    }
    public static function GetSubscription($company){
        static::SetApiKey();
        $company = Company::resolve($company);

        $customer = static::GetCustomer($company);
        $subscription = null;

        if (count($customer->subscriptions->data) > 0){            
            $subscription = $customer->subscriptions->data[0];
        }

        return $subscription;
    }

    public static function GetCustomer($company){
        $company = Company::resolve($company);
        static::SetApiKey();
        $customer = null;
        if($company->customer_id == null){
            $customer = \Stripe\Customer::create(array(
                  "description" => $company->title,
                  "email" => $company->admin_email,
                  "metadata" => array('operation' => $company->operation, 'guid' => $company->guid)
              )
            );

            $company->customer_id = $customer->id;
            $company->save();
        }
        else{
            $customer = \Stripe\Customer::retrieve($company->customer_id);
        }

        return $customer;
    }
}
