<?php

use Illuminate\Auth\UserTrait;
use Illuminate\Auth\UserInterface;
use Illuminate\Auth\Reminders\RemindableTrait;
use Illuminate\Auth\Reminders\RemindableInterface;

class AppSession {

	public static function process($action,$subject, $data = null){
		
		$replyData = null;
		switch($action){
			case 'get':
				$replyData = static::get($subject, $data);
				break;
			case 'set':						
				$replyData = static::set($subject, $data);					
				break;
		}	
		return $replyData;
	}

    public static function get($subject,$data = null){
		$currentUser = User::currentUser();
        $retval = $currentUser;
        switch ($subject){
            case 'user':
                if ($currentUser != null){
                    if (!is_object($currentUser)){
                        throw new \StopException ('No user');
                    }
                    $currentUser = Uquery::get($currentUser->key_base);
                    if (count($currentUser) > 0){
                        Session::put('currentUser', $currentUser[0]);
                    }
                    $user = Session::get('currentUser');
                    
                    $retval = array('user' => Session::get('currentUser'));

                    if (Session::has('pushEmail')){
                        $retval['pushEmail'] = Session::get('pushEmail');
                    }
                }
                else{
                    throw new \StopException ('No user');
                }
                break;
            case 'login':
                $currentUser = User::remoteLogin($data);				
               
                $retval = array(
                    'user' => $currentUser,
                    'company' => User::currentCompany()
                );
                break;
            case 'invite':
                $retval = Session::get('invite',null);
                break;
            case 'state':
                $retval = array(
                    'user' => UserState::GetState($currentUser->key_base, Request::ip()),
                    'company' => User::currentCompany(true),
                    'system' => array(
                        'stripe_key' => Subscription::GetPublicKey(),
                        'environment' => App::environment()
                    ));
                break;
            case 'version':
                $versionData = array(
                    array(
                        'version' => 3.4,
                        'changes' => array('Fixed database issues'),
                        'hardRefresh' => false
                        ),
                    array(
                        'version' => 3.2,
                        'changes' => array('Added equipment objects','Integrated equipment with checklists','Bug fixes'),
                        'hardRefresh' => true
                        ),
                    array(
                        'version' => 3.0,
                        'changes' => array('Major database restructure','Added full names to checklists','Bug fixes'),
                        'hardRefresh' => true
                        ),
                    array(
                        'version' => 2.4,
                        'changes' => array('Major database restructure','Introduced Procedures'),
                        'hardRefresh' => true
                        )
                );

                $retval = $versionData;
                break;

        }
        return $retval;
    }

	public static function set($subject, $data){
		$retval = array();
        $currentUser = User::currentUser();
		switch($subject){
            case 'state':
				$retval = UserState::SetState($currentUser->key_base, $data, Request::ip());
				break;
			case 'createProfile':
				$retval = User::createProfile($data);
				break;
			case 'push':
				if (is_object($currentUser) && $currentUser->superuser == '1'){
					$newuser = Uquery::get($data);
					if (count($newuser) > 0){
						$retval = User::setSession($newuser[0]);;
					}
					else{
						$retval = 'Not found';
					}
				}
				else{
					throw new StopException('Not allowed');
				}
				break;
			case 'user': case 'currentUser':
                User::setSession($data);
				$retval = User::currentUser();
				break;
			case 'newuser':
				$newuser = User::remoteCreate($data);
                User::setSession($newuser);
                $retval = User::currentUser();
				break;
            case 'invite':
                    $retval = Invite::sendInvite($data['email']);
                    break;
            case 'end':
                User::setSession(null);
            	$retval = true;
            	break;
            case 'updateDetails':
            	$currentUser->fullname = $data['fullname'];
            	$currentUser->email = $data['email'];
            	$currentUser->username = $data['username'];
            	Uquery::set($currentUser->key_base,$currentUser->toArray());
        		$currentUser = Uquery::get($currentUser->key_base);
				if (count($currentUser) > 0){
					Session::put('currentUser', $currentUser[0]);
				}
				$retval = "updated details";
            	break;
            case 'changePassword':
        		$currentUser = User::find($currentUser->id);
        		if (Hash::check($data['current'], $currentUser->password)){
        			$currentUser = $currentUser->toArray();
        			$currentUser['password'] = $data['new'];

        			Uquery::set($currentUser['key_base'],$currentUser);
        			$retval = "password changed";
        		}
        		else{
        			throw new StopException("invalid password");
        		}
            	break;
            case 'changeCard':
                $retval = Company::updateCard(User::currentCompany()->id,$data['source']);
                break;
            case 'changePlan':
                $retval = Company::changePlan(User::currentCompany()->id,$data['newPlan']);
                break;
		}		
		return $retval;
	}
	
	public static function end(){
		Session::flush();
		return "Session Wiped";
	}

}
