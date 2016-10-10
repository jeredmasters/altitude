<?php


class Invite extends BaseModel {
	protected $table = 'invites';
	protected $json = array('roles');

	public static function sendInvite($email, $company = null, $roles = array()){
		$user = Session::get('currentUser');

		if ($company == null){
			$company = $user->company;
		}
        
		$invite = new Invite;

		$invite->email = $email;
		$invite->company = $company;
		$invite->created_by = ($user == null || !is_object($user) ? -1 : $user->id);
		$invite->roles = $roles;

		$invite->save();
		
		$data = array();

        Email::Send($data,'Invite to Altitude',$email,'invite',$invite->id);
		//NotificationHandler::fire(array('entity.invite.'.$invite->id, 'entity.invite'),'create', $invite, array('user'=>$invite->created_by,'company'=>$invite->company));
		return $invite;
	}

}
