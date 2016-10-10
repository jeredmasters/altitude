<?php


class Notification extends BaseModel {
	protected $table = 'subscriptions';

	public static function Subscribe($uquery, $action, $userId = null) {
		$subscription = new Subcription;
		$subscription->uquery = $uquery;
		$subscription->action = $action;
		$subscription->user = $userId;
		$subscription->save();
	}

    public static function set ($key,$data){
        if (is_string($key)){
			$key = new Uquery($key);
		}
        $vals = Uquery::get($key);
        $val = new Notification;
		if (count($vals) > 0){
			$val = $vals[0];
		}
		
		$val->key = $data['key'];
		$val->key_base = $data['key_base'];
		$val->user = $data['user'];
		$val->uquery = $data['uquery'];
		$val->action = $data['action'];

		
		$val->save();
		
		return $val;
    }
}


class NotificationHandler {
	
	public static function fire($key, $action, $data, $context = array()){
		$retval = array();
		if (is_string($key)){
			$key = new Uquery($key);
		}
		
		if (is_object($data)){
			$data = (array)$data;
		}
		
		$search = Notification::where('action','=',$action);

		$search->where('uquery','LIKE',$key->type . '%');
		
		$subscriptions = $search->get();
		
		$data = static::prepareData($data, $key);
		
		foreach($subscriptions as $sub){
			$sub_uquery = new Uquery($sub->uquery);
			
			if ($sub_uquery->match($key)){
				$retval[] = $sub;
				$retval[] = $user = Uquery::get($sub->user);
				if (count($user) > 0){
					$user = $user[0];
					$retval[] = $user;
					if ($user->superuser != '1' && isset($data['company']) && $user->company != $data['company']){
						continue;
					}
					Mail::send('emails.subscription',array('data'=>$data), function($message) use ($user,$action,$key,$sub,$data)
					{
						$message->from('subscriptions@novalab.com.au', 'Altitude Subscription');
		
						$message->to($user->email);
		
						//$message->attach($pathToFile);
						$action_name = $action;
						switch($action){
							case 'create':
							 	$action_name = 'New';
							 	break;
							 	
							case 'update':
								$action_name = 'Updated';
								break;
								
							case 'delete':
								$action_name = 'Deleted';
								break;
						}
						
						$subject = $action_name . ' ' . ucwords($key->s_type);
						
						if (isset($data['Title']) && $data['Title'] != 'Unknown Data Object'){
							$subject .= ': ' . $data['Title'];
						}
		
						$message->subject($subject);
					});
				}
			}
		}
		
		return $retval;
	}
	
	
	public static function prepareData($input, $key){
		$output = array();
		
		$output['Title'] = static::getValue($input,array('title','Title','handle','fullname','key_base','key','id'),'Unknown Data Object');
		$output['Date'] = static::getValue($input,array('date','Date','timestamp','modified_at','created_at'),'Unknown Date');

		//convert unix timestamps, this rexeg will stop working Wed, 18 May 2033 03:33:20 GMT
		if (preg_match('/[1]\d{9}/',$output['Date'])){
			$output['Date'] = gmdate('Y-m-d H:i:s',$output['Date']);
		}
		
		$user = null;
		if ($key->s_type == 'user'){
			$user = $key->key_base;
		}
		else{
			$user = static::getValue($input,array('user','_user','created_by','createdby'),null);
		}
		
		if ($user != null){
			$user = Uquery::get($user);
			if (count($user) > 0){
				$output['User'] = $user[0]->fullname;
			}
		}
		
		$information = static::getValue($input,array('data'),null);
		if ($information != null){
			$output['Information'] = $information;
		}
		
		
		
		
		return $output;
	}
	
	public static function getValue($data,$keys,$fallback = 'N/A'){
		$retval = $fallback;
		if (!is_array($keys)){
			$keys = array($keys);
		}
		foreach($keys as $key){
			if (isset($data[$key])){
				$retval = $data[$key];
				break;
			}
		}
		if (is_object($retval)){
			$retval = (array)$retval;
		}
		
		return $retval;
	}
}
