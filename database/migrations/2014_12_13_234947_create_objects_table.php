<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateObjectsTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('objects', function(Blueprint $table)
		{
		    $table->increments('id');
		    $table->string('company');
		    $table->string('key');
		    $table->string('key_base');
		    $table->string('created_by');
		    $table->string('created_ts');
		    $table->string('type');
		    $table->string('scaffold');
		    $table->string('title');
		    $table->datetime('date')->nullable();
		    $table->string('status')->nullable();
		    $table->boolean('enabled')->default(true);
		    $table->text('data')->nullable();
		    $table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('objects');
	}
}
