<?php namespace App\Http\Controllers;
      use Input, Session, Response;
      use Uquery;
class DataController extends Controller {

	
	public function anyInit(){
		$retval = array();
		
		$client_keys = Input::get('state',array());
		$fullsync = Input::get('fullsync','false');
		
		

		if ($fullsync == 'true'){
			$server_keys = Uquery::getAllKeys();
			foreach($client_keys as $key){
				if (!in_array($key,$server_keys)){
					$retval['send'][] = $key;
				}
			}
			foreach($server_keys as $key){
				if (!in_array($key,$client_keys)){
					$retval['get'][] = $key;
				}
			}
		}
		else{
			$server_keys = Uquery::getKeys();
			foreach($client_keys as $base => $key){
	
				
				if (isset($server_keys[$base])){
					$cmp = strcmp($server_keys[$base],$key);
					if ($cmp < 0){ // client is newer
						$retval['send'][] = $key;
					}
					if ($cmp > 0){
						$retval['get'][] = $server_keys[$base];
					}
				}
				else{
					$retval['send'][] = $key;
				}
			}
			foreach($server_keys as $base => $key){
				if (!isset($client_keys[$base])){
					$retval['get'][] = $key;
				}
			}
		}
		
		
		return Response::json($retval);
	}
	
	public function anySet(){
		
		$data = Input::get('data');
		$key = Input::get('key', $data['key']);
		
		
		Uquery::set($key,$data);
	}
	public function anyGet(){
		$key = Input::get('key');
		
		return Response::json(Uquery::get($key));
	}
	
	public function anyTest(){
		return Response::json(Uquery::getKeys());
	}
	public function anyFire(){
		/*$retval = array();
		$retval[] = $a = new Uquery('object.checklist:*');
		$retval[] = $b = new Uquery('object.checklist:iuwegn95-D20150701T141438Z534');
		$retval[] = $a->match($b);*/
		$retval = NotificationHandler::fire('user:jeredtest-D20150703T063430Z647', 'create', Uquery::get('user:jeredtest-D20150703T063430Z647')[0]);
		return Response::json($retval);
	}
	public function anyUquery(){
		$key = Input::get('key','user:jered');
		return Response::json(new Uquery($key));
	}
	public function anySubscribe(){
		
		$user = new Uquery(Input::get('user'));
		$uquery = new Uquery(Input::get('uquery'));
		$action = Input::get('action');

		return Uquery::set('subscription:' . $user->handle . '.' . $action . '.' . $uquery->s_type, array(
			'uquery' => $uquery->raw,
			'action' => $action,
			'user' => $user->key_base
			));
			/*
		Uquery::set('subscription:robchecklists-D20150701T141438Z534', array(
			'uquery' => 'object.checklist:*',
			'action' => 'create',
			'user' => 'user:Robert.Leake'
			));
			*/
			
		
	}
	

}