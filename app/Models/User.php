<?php

use Illuminate\Auth\UserTrait;
use Illuminate\Auth\UserInterface;
use Illuminate\Auth\Reminders\RemindableTrait;
use Illuminate\Auth\Reminders\RemindableInterface;

class User extends BaseModel {

	/**
	 * The database table used by the model.
	 *
	 * @var string
	 */
	protected $table = 'users';
	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	 
	
	protected $json = array('roles');
	protected $hidden = array('id', 'password', 'remember_token');
	


	public static function remoteCreate($data, $user = null){		
		
		if (Session::has('invite')){
			$invite = json_decode(Session::get('invite'));

			$data['company'] = $invite->company;
			$data['roles'] = $invite->roles;
            $data['email'] = $invite->email;
			
			Invite::where('id','=',$invite->id)->update(array('spent'=>true));
		}
		
		$key = 'user:' . Uquery::makeHandle($data['email']);
		
		$user = Uquery::set($key,$data);
		
		return $user;	
	}
	public static function set ($key,$data){
        if (is_string($key)){
			$key = new Uquery($key);
		}
		
		$existingUser = Uquery::get($key->key_base);
		
		
        $val = new User;
        
        $newUser = true;
        if (count($existingUser) > 0){
        	$newUser = false;
        	$existingUser = $existingUser[0]; //get first
        }


		$val->key = $data['key'];
		$val->key_base = $data['key_base'];

		$val->username = $data['email'];
		$val->email = $data['email'];
		$val->fullname = $data['fullname'];
		
		
		
		if ($newUser){
			$val->roles = array();
			$val->superuser = '0';
			$val->password = 'not set';
            $val->status = 'active';
		}
		else{
			$val->company = $existingUser->company;
			$val->roles = $existingUser->roles;
			$val->superuser = $existingUser->superuser;
			$val->password = $existingUser->password;
		}
        if (isset($data['status'])){
            $val->status = $data['status'];
        }
		if (isset($data['company'])){
			$val->company = $data['company'];
		}
		if (isset($data['roles'])){
			$val->roles = $data['roles'];
		}
		if (isset($data['password'])){
			$val->password = Hash::make($data['password']);
		}
		
		if (!$newUser){
			//User::where('key_base', '=', $key->key_base)->update(array('password' => ''));
		}

        $company = User::currentCompany();
		if ($company != null && is_object($company)){
			$val->company = $company->guid;
		}

		$val->save();
		
		return $val;
    }


	public static function CreateFromProvider($provider, $data){

		$user = User::where('username',$data['id'])->first();


			$user = static::remoteCreate(array(
				'email' => $data['email'],
				'fullname' => $data['name'],
				'username' => $data['id'],
				'password' => ""
			), $user);


			switch ($provider){
				case 'google':
					$user->oauth_google = $data['id'];
					break;
				case 'facebook':
					$user->oauth_facebook = $data['id'];
					break;
				case 'linkedin':
					$user->oauth_linkedin = $data['id'];
					break;
			}

			static::saveNewUser($user);

		


		return $user;	
	}

	public static function saveNewUser($user){

		if (Session::has('invite')){
			$invite = json_decode(Session::get('invite'));

			$user->company = $invite->company;		
			
			$invite->status = 'used';
			$invite->save();
		}

		$action = 'create';

		if (isset($user->id) && $user->id != null){
			$action = 'update';
		}

		$user->save();
		

		//NotificationHandler::fire(array('entity.user.'.$user->id, 'entity.user'),$action, $user, array('user'=>$user->id, 'company' => $user->company));

		$invite = Invite::find($invite->id);
		$invite->status = 'used';
		$invite->save();
	}
    public static function setSession($userkey){
        $company = null;
        if ($userkey != null){            
            if (is_string($userkey)){
                $userkey = User::where('key_base','=',$userkey)->orderBy('created_at','DESC')->first();
            }
            $company = Company::guid($userkey->company);
        }
        Session::set('currentUser',$userkey);
        Session::set('currentCompany',$company);
    }
	public static function currentUser(){
		if (Session::has('currentUser')){
			return Session::get('currentUser');
		}
		return null;
	}
    public static function currentCompany($refresh = false){
		if (Session::has('currentCompany')){
            if ($refresh){
                Session::set('currentCompany', Company::find(Session::get('currentCompany')->id));
            }
			return Session::get('currentCompany');
		}
		return null;
	}

	public static function remoteGetUser($operation,$context,$data){

		if (Session::has('currentUser')){
			return array(Session::get('currentUser'));
		}
		
		
	}
	public static function remoteLogin($data){
		$users = User::
            Where('email','like',$data['email'])->
            orderBy('key','desc')->
            get();
			
		
		$password = $data['password'];
		foreach($users as $matchinguser){
			if (Hash::check($password,$matchinguser->password) == false){
				
			}
			else{
                static::setSession($matchinguser);
				return $matchinguser;
			}
		}
		throw new StopException ('Invalid Email or Password.');
	}


        public static function get($uquery){
            if ($uquery->filter == '*'){
                $keys = DB::table('users')->select('key')->distinct()->get();
            }
            else{
                    return array(User::find($uquery->filter));
		    }
	    }


        public static function process($uquery, $data = array()){
                $replyData = null;
                switch($uquery->action()){
                        case 'get':
                                $replyData = static::get($uquery);
                                break;
                        case 'set':
                                $replyData = static::set($uquery, $data);
                                break;
                }
                return $replyData;
        }
        
        
	public static function CreateProfile($data) {

        $seeded = array(
            'created_ts' => date('u'),
            );
        if ($data['operation'] == 'recreational'){
            $data['company'] = $data['name'];
        }

        $company = new Company;
        $company->title = $data['company'];
        $company->commercial = ($data['operation'] == 'commercial');
        $company->guid = Uquery::generateRandomString(15);
        $company->admin_email = $data['email'];
        $company->subscription_plan = $data['plan'];
		$company->save();
        $company = Subscription::DigestCompany($company);

        Session::set('currentCompany',$company);

        $seeded['company'] = $company->guid;

        $seeded['user'] = $newuser = Uquery::set(
			'user:'.Uquery::makeHandle($data['email']),
			array(
                'company' => $company,
				'fullname' => $data['name'],
                'username' => $data['email'],
                'password' => $data['password'],
                'email' => $data['email'],
                'roles' => (($data['operation'] == 'commercial') ? array('admin') : array())
			)
		)['key_base'];

        $seeded['scaffolds'] = array();
        $seeded['objects'] = array();
        $seed_scaffolds = array(
            'equipment_battery',
            'equipment_uas'
            );
        $seed_objects = array();
        foreach($data['units'] as $unit){
            $seed_scaffolds[] = 'checklist_' . $unit;
            $seed_objects[] = 'equipment_' . $unit;
            $seeded['units'][] = array('label' => $unit, 'value' => $unit);// for the json prefils
        }
       

        foreach($seed_scaffolds as $prefill_name){
            $scaffold = Uquery::getPrefill('scaffold_' . $prefill_name, $seeded);
            $key = 'scaffold.'.$scaffold['type'].':'.Uquery::makeHandle($scaffold['title']);
            $seeded['scaffolds'][$prefill_name] = Uquery::set($key, $scaffold)['key_base'];
        }

        foreach($seed_objects as $prefill_name){
            $object = Uquery::getPrefill('object_' . $prefill_name, $seeded);
            $key = 'object.'.$object['type'].':'.Uquery::makeHandle($object['title']);
            $seeded['objects'][$prefill_name] = Uquery::set($key, $object)['key_base'];
        }

        static::setSession($newuser);		
        Email::Send($data, "Welcome to Altitude", $data['email'], 'welcome');
		return $seeded;
	}

}
